import { fieldInfo, fieldOrder, numberedField, type CronField, type CronFormat } from "./cronValidation";

export type CronRule = "any" | "value" | "list" | "range" | "interval" | "custom" | "skip"
  | "lastDay" | "monthEnd" | "workday" | "monthEndWorkday" | "lastWeekday" | "nthWeekday" | "omit";

export interface CronFieldDraft {
  mode: CronRule;
  first: number | null;
  last: number | null;
  step: number | null;
  occurrence: number | null;
  custom: string;
  multiple: string[];
}

export function newCronFieldDraft(field: CronField, format: CronFormat, mode: CronRule, custom = ""): CronFieldDraft {
  const { min, max } = fieldInfo(field, format);
  return {
    mode,
    first: mode === "interval" ? null : mode === "monthEnd" ? 1 : mode === "monthEndWorkday" ? 0 : min,
    last: mode === "interval" ? null : Math.min(min + 1, max),
    step: 2,
    occurrence: 1,
    custom,
    multiple: [],
  };
}

export function readCronFieldDraft(field: CronField, format: CronFormat, token: string, preferList = false): CronFieldDraft {
  const draft = newCronFieldDraft(field, format, "custom", token);
  const text = numberedField(token, field, format);
  const interval = /^(\*|\d+)(?:-(\d+))?\/(\d+)$/.exec(text);
  if (text === "*") draft.mode = "any";
  else if (text === "?") draft.mode = "skip";
  else if (!text && field === "year") draft.mode = "omit";
  else if (/^\d+(,\d+)+$/.test(text) || preferList && /^\d+$/.test(text)) {
    draft.mode = "list";
    draft.multiple = text.split(",").map(value => String(Number(value)));
  } else if (/^\d+$/.test(text)) {
    draft.mode = "value";
    draft.first = Number(text);
  } else if (/^\d+-\d+$/.test(text)) {
    draft.mode = "range";
    [draft.first, draft.last] = text.split("-").map(Number);
  } else if (interval) {
    const [, start, end, amount] = interval;
    draft.mode = "interval";
    draft.first = start === "*" ? null : Number(start);
    draft.last = end ? Number(end) : null;
    draft.step = Number(amount);
  } else if (format === "quartz" && field === "day") {
    const end = /^L(?:-(\d+))?(W)?$/.exec(text);
    const weekday = /^(\d+)W$/.exec(text);
    if (end) {
      draft.first = Number(end[1] ?? 0);
      draft.mode = end[2] ? "monthEndWorkday" : draft.first ? "monthEnd" : "lastDay";
    } else if (weekday) {
      draft.mode = "workday";
      draft.first = Number(weekday[1]);
    }
  } else if (format === "quartz" && field === "weekday") {
    const special = /^([1-7])(L|#[1-5])$/.exec(text);
    if (special) {
      draft.first = Number(special[1]);
      draft.mode = special[2] === "L" ? "lastWeekday" : "nthWeekday";
      if (draft.mode === "nthWeekday") draft.occurrence = Number(special[2][1]);
    } else if (text === "L" && preferList) {
      draft.mode = "list";
      draft.multiple = ["7"];
    }
  }
  return draft;
}

export function writeCronFieldDraft(field: CronField, format: CronFormat, draft: CronFieldDraft): string {
  const { first, last, step, occurrence } = draft;
  const reversed = first != null && last != null && first > last && (format === "unix" || field === "year");
  switch (draft.mode) {
    case "any": return "*";
    case "skip": return "?";
    case "omit": return "";
    case "value": return first == null ? "" : String(first);
    case "list": return draft.multiple.join(",");
    case "range": return first == null || last == null || reversed ? "" : first + "-" + last;
    case "interval": {
      const { min, max } = fieldInfo(field, format);
      if (step == null || step < 1 || reversed || format === "quartz" && field !== "year" && last == null && step > max) return "";
      const range = last == null ? first ?? "*" : (first ?? min) + "-" + last;
      return range + "/" + step;
    }
    case "lastDay": return "L";
    case "monthEnd": return first == null ? "" : first === 0 ? "L" : "L-" + first;
    case "monthEndWorkday": return first ? "L-" + first + "W" : "LW";
    case "workday": return first == null ? "" : first + "W";
    case "lastWeekday": return first == null ? "" : first + "L";
    case "nthWeekday": return first == null || occurrence == null ? "" : first + "#" + occurrence;
    case "custom": return draft.custom.trim().toUpperCase();
  }
}

export function updateCronField(tokens: readonly string[], format: CronFormat, field: CronField, value: string) {
  if (format === "quartz" && field === "year" && !value) return tokens.slice(0, 6);
  const index = fieldOrder(format, true).indexOf(field);
  const next = [...tokens];
  next[index] = value;
  if (format === "quartz" && (field === "day" || field === "weekday")) {
    const other = field === "day" ? 5 : 3;
    if (value !== "?") next[other] = "?";
    else if (next[other] === "?") next[other] = "*";
  }
  return next;
}

export function cronFieldChoices(field: CronField, format: CronFormat) {
  const { min, max } = fieldInfo(field, format);
  return Array.from({ length: max - min + 1 }, (_, index) => {
    const value = index + min;
    const name = field === "weekday" ? "星期" + "日一二三四五六"[index % 7] + (index === 7 ? "（7）" : "")
      : field === "month" ? value + " 月" : undefined;
    return { value: String(value), label: name ?? String(value) };
  });
}
