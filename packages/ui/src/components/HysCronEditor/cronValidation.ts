export type CronFormat = "unix" | "quartz";
export type CronField = "second" | "minute" | "hour" | "day" | "month" | "weekday" | "year";

const months = "JAN FEB MAR APR MAY JUN JUL AUG SEP OCT NOV DEC".split(" ");
const weekdays = "SUN MON TUE WED THU FRI SAT".split(" ");
export const cronFields: Record<CronField, { label: string; min: number; max: number; names?: string[] }> = {
  second: { label: "秒", min: 0, max: 59 },
  minute: { label: "分钟", min: 0, max: 59 },
  hour: { label: "小时", min: 0, max: 23 },
  day: { label: "日期", min: 1, max: 31 },
  month: { label: "月份", min: 1, max: 12, names: months },
  weekday: { label: "星期", min: 0, max: 7, names: weekdays },
  year: { label: "年份", min: 1970, max: 2099 },
};

export function fieldInfo(field: CronField, format: CronFormat) {
  const info = cronFields[field];
  return field === "weekday" && format === "quartz" ? { ...info, min: 1 } : info;
}

export function fieldOrder(format: CronFormat, includeYear = false): CronField[] {
  const common: CronField[] = ["minute", "hour", "day", "month", "weekday"];
  return format === "unix" ? common : ["second", ...common, ...(includeYear ? ["year" as const] : [])];
}

export function numberedField(token: string, field: CronField, format: CronFormat) {
  const { min, names } = fieldInfo(field, format);
  return names ? token.replace(/(^|[-,])([A-Z]{3})(?=$|[,-/#]|L$)/g, (_match, prefix: string, name: string) => {
    const index = names.indexOf(name);
    return index < 0 ? prefix + name : prefix + String(index + min);
  }) : token;
}

const aliases: Record<string, string> = {
  "@yearly": "0 0 1 1 *",
  "@annually": "0 0 1 1 *",
  "@monthly": "0 0 1 * *",
  "@weekly": "0 0 * * 0",
  "@daily": "0 0 * * *",
  "@midnight": "0 0 * * *",
  "@hourly": "0 * * * *",
};

export function normalizeCron(expression: string) {
  const stripped = expression.trim().replace(/\s+/g, " ");
  return stripped.startsWith("@") ? stripped.toLowerCase() : stripped.toUpperCase();
}

export function cronTokens(expression: string, format: CronFormat) {
  const normalized = normalizeCron(expression);
  if (format === "unix" && Object.hasOwn(aliases, normalized)) return aliases[normalized].split(" ");
  return normalized ? normalized.split(" ") : [];
}

type DayRule =
  | { kind: "monthEnd" | "monthEndWeekday"; offset: number }
  | { kind: "nearestWeekday"; day: number }
  | { kind: "lastWeekday"; weekday: number }
  | { kind: "nthWeekday"; weekday: number; occurrence: number };
export type FieldValues = { values: number[]; rules: DayRule[]; wildcard: boolean; unspecified: boolean };
export type CronIssue = { message: string; field?: CronField; token?: string };
export type CalendarCron = { kind: "calendar"; format: CronFormat; tokens: string[]; fields: Record<CronField, FieldValues> };
export type CronResult =
  | { kind: "invalid"; issue: CronIssue }
  | { kind: "reboot" }
  | CalendarCron;

function readDayRule(field: CronField, item: string): DayRule | undefined {
  if (field === "day") {
    const end = /^L(?:-(\d+))?(W)?$/.exec(item);
    if (end && Number(end[1] ?? 0) <= 30) {
      return { kind: end[2] ? "monthEndWeekday" : "monthEnd", offset: Number(end[1] ?? 0) };
    }
    const nearest = /^(\d+)W$/.exec(item);
    if (nearest && Number(nearest[1]) >= 1 && Number(nearest[1]) <= 31)
      return { kind: "nearestWeekday", day: Number(nearest[1]) };
  }
  if (field === "weekday") {
    const last = /^([1-7])L$/.exec(item);
    if (last) return { kind: "lastWeekday", weekday: Number(last[1]) - 1 };
    const nth = /^([1-7])#([1-5])$/.exec(item);
    if (nth) return { kind: "nthWeekday", weekday: Number(nth[1]) - 1, occurrence: Number(nth[2]) };
  }
}

function parseField(key: CronField, token: string, format: CronFormat): FieldValues | CronIssue {
  const { label, min, max } = fieldInfo(key, format);
  const fail = (message: string, item = token) => ({ field: key, token: item, message: label + message });
  const quartz = format === "quartz";
  const result: FieldValues = { values: [], rules: [], wildcard: token.startsWith("*"), unspecified: token === "?" };
  if (token === "?" && quartz && (key === "day" || key === "weekday")) return result;
  const values = new Set<number>();
  const items = token.split(",");
  for (const raw of items) {
    let item = numberedField(raw, key, format);
    if (quartz) {
      const rule = readDayRule(key, item);
      if (rule) {
        if (items.length > 1 && (key === "weekday" || rule.kind === "nearestWeekday" || rule.kind === "monthEndWeekday"))
          return fail("的此类特殊规则需单独使用", raw);
        result.rules.push(rule);
        continue;
      }
      if (key === "weekday" && item === "L" && items.length === 1) item = "7";
    }
    const match = /^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(item);
    if (!match) return fail("包含无效格式", raw);
    const [, start, end, step] = match;
    const first = start === "*" ? min : Number(start);
    const last = end !== undefined ? Number(end) : start === "*" || step !== undefined ? max : first;
    const increment = Number(step ?? 1);
    if (first < min || first > max) return fail(`需在 ${min}–${max} 之间`, raw);
    if (last < min || last > max || (end !== undefined && start === "*") || (last < first && (!quartz || key === "year")))
      return fail("范围无效", raw);
    if (!Number.isSafeInteger(increment) || increment < 1) return fail("步长必须为正整数", raw);
    if (quartz && key !== "year" && end === undefined && increment > max)
      return fail(`步长不能大于 ${max}`, raw);
    const span = max - min + 1;
    const wrapped = last < first ? last + span : last;
    for (let value = first; value <= wrapped; value += increment) {
      const number = min + (value - min) % span;
      values.add(key === "weekday" ? quartz ? number - 1 : number % 7 : number);
    }
  }
  result.values = [...values].sort((a, b) => a - b);
  return result;
}

export function parseCron(expression: string, format: CronFormat = "unix"): CronResult {
  if (format === "unix" && normalizeCron(expression) === "@reboot") return { kind: "reboot" };
  const tokens = cronTokens(expression, format);
  if (format === "unix" ? tokens.length !== 5 : tokens.length !== 6 && tokens.length !== 7) {
    return { kind: "invalid", issue: {
      message: format === "unix" ? "请输入五段 Unix Cron 表达式或有效的 @ 简写" : "请输入六段或七段 Quartz Cron 表达式",
    } };
  }
  const order = fieldOrder(format, tokens.length === 7);
  const parts: Partial<Record<CronField, FieldValues>> = {};
  for (const [index, field] of order.entries()) {
    const value = parseField(field, tokens[index], format);
    if ("message" in value) return { kind: "invalid", issue: value };
    parts[field] = value;
  }
  if (format === "quartz" && parts.day?.unspecified === parts.weekday?.unspecified) {
    return { kind: "invalid", issue: { field: "weekday", token: tokens[5], message: "Quartz 的日期和星期恰好一项应为 ?" } };
  }
  const any = (values: number[]): FieldValues => ({ values, rules: [], wildcard: true, unspecified: false });
  return { kind: "calendar", format, tokens, fields: {
    ...parts,
    second: parts.second ?? any([0]),
    year: parts.year ?? any([]),
  } as Record<CronField, FieldValues> };
}
