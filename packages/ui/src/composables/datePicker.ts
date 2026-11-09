import type { CSSProperties, VNodeChild } from "vue";
import type { Placement } from "./useFloating";
import {
  calendarDay,
  calendarDate,
  calendarFormat,
  calendarISO,
  calendarParts,
  calendarShift,
  calendarWeek,
  civilDay,
} from "./calendar";
export type HysDateScalar = string | Date | number;
export type HysDatePickerValue =
  HysDateScalar | readonly (HysDateScalar | null)[] | null;
export type HysDateRangeValue =
  readonly [HysDateScalar | null, HysDateScalar | null] | null;
export type HysDatePickerType =
  | "date"
  | "dates"
  | "week"
  | "month"
  | "months"
  | "quarter"
  | "quarters"
  | "year"
  | "years"
  | "datetime";
export type HysDatePickerView = "date" | "month" | "quarter" | "year";
export type HysDatePickerUnit = "date" | "week" | "month" | "quarter" | "year";
export interface HysDatePoint {
  day: number;
  second: number;
}
export interface HysDatePickerContext {
  range: "start" | "end";
  from: Date | null;
  iso: string;
}
export interface HysDateDisabledTime {
  hours?: readonly number[];
  minutes?: (hour: number) => readonly number[];
  seconds?: (hour: number, minute: number) => readonly number[];
}
export interface HysDateShortcut {
  label: string;
  value: HysDatePickerValue | (() => HysDatePickerValue);
  disabled?: boolean;
}
export interface HysDatePickerCell {
  date: Date;
  iso: string;
  value: number;
  end: number;
  text: string;
  type: HysDatePickerView;
  outside: boolean;
  disabled: boolean;
  selected: boolean;
  inRange: boolean;
  today: boolean;
  week: number;
}
export interface HysDatePickerChange {
  source: "date" | "time" | "input" | "shortcut" | "clear" | "confirm" | "api";
  dates: readonly (Date | null)[];
  formatted: readonly string[];
}
export interface HysDatePickerLocale {
  today: string;
  now: string;
  clear: string;
  cancel: string;
  close: string;
  confirm: string;
  start: string;
  end: string;
  chooseStart: string;
  chooseEnd: string;
  invalid: string;
  week: string;
  year: string;
  month: string;
  back: string;
  prevMonth: string;
  nextMonth: string;
  prevYear: string;
  nextYear: string;
  hour: string;
  minute: string;
  second: string;
  empty: string;
  limit: string;
}
export interface HysDatePickerProps<
  V extends HysDatePickerValue = HysDatePickerValue,
> {
  modelValue?: V;
  defaultValue?: V;
  clearValue?: V;
  type?: HysDatePickerType;
  valueType?: "string" | "date" | "timestamp";
  valueFormat?: string;
  format?: string;
  inputFormats?: readonly string[];
  disabled?: boolean | readonly [boolean, boolean];
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  status?: "error" | "warning" | "success";
  bordered?: boolean;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  name?: string | readonly [string, string];
  form?: string;
  autofocus?: boolean;
  min?: HysDateScalar;
  max?: HysDateScalar;
  disabledDate?: (date: Date, context: HysDatePickerContext) => boolean;
  disabledTime?: (
    date: Date,
    context: HysDatePickerContext,
  ) => HysDateDisabledTime;
  firstDayOfWeek?: number;
  locale?: string;
  messages?: Partial<HysDatePickerLocale>;
  showWeekNumbers?: boolean;
  showAdjacentDays?: boolean;
  defaultPickerValue?: HysDateScalar;
  panelValue?: HysDateScalar;
  mode?: HysDatePickerView;
  defaultMode?: HysDatePickerView;
  shortcuts?: readonly HysDateShortcut[];
  clearable?: boolean;
  editable?: boolean;
  inputReadonly?: boolean;
  showOnFocus?: boolean;
  showToday?: boolean;
  showNow?: boolean;
  showFooter?: boolean;
  showConfirm?: boolean;
  showTime?: boolean;
  defaultTime?: string | readonly [string, string];
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  showSeconds?: boolean;
  rangeSeparator?: string;
  startPlaceholder?: string;
  endPlaceholder?: string;
  allowEmpty?: readonly [boolean, boolean];
  singlePanel?: boolean;
  unlinkPanels?: boolean;
  minRangeDays?: number;
  maxRangeDays?: number;
  rangeValidation?: "endpoints" | "continuous";
  maxDates?: number;
  open?: boolean;
  defaultOpen?: boolean;
  inline?: boolean;
  placement?: Placement;
  appendTo?: string | HTMLElement | false;
  popupWidth?: number | string;
  popupClass?: string;
  popupStyle?: CSSProperties;
  validateEvent?: boolean;
  cellClassName?: (cell: HysDatePickerCell) => string;
}
export interface HysDateRangePickerProps<
  V extends HysDatePickerValue = HysDateRangeValue,
> extends HysDatePickerProps<V> {}
export interface HysDatePickerInstance<
  V extends HysDatePickerValue = HysDatePickerValue,
> {
  readonly element: HTMLElement | undefined;
  readonly open: boolean;
  readonly value: V;
  readonly draft: readonly (Date | null)[];
  focus: () => void;
  blur: () => void;
  show: () => Promise<boolean>;
  hide: (restoreFocus?: boolean) => void;
  handleOpen: () => Promise<boolean>;
  handleClose: () => void;
  clear: () => Promise<boolean>;
  setValue: (value: V) => Promise<boolean>;
  confirm: () => Promise<boolean>;
  cancel: () => void;
  showMonth: (value: HysDateScalar) => Promise<boolean>;
  setMode: (view: HysDatePickerView) => boolean;
}
export interface HysDatePickerSlots {
  default?: (cell: HysDatePickerCell) => any;
  cell?: (cell: HysDatePickerCell) => any;
  prefix?: () => any;
  suffix?: () => any;
  "clear-icon"?: () => any;
  "prev-month"?: () => any;
  "next-month"?: () => any;
  "prev-year"?: () => any;
  "next-year"?: () => any;
  header?: (context: {
    dates: readonly (Date | null)[];
    view: HysDatePickerView;
  }) => any;
  footer?: (context: {
    dates: readonly (Date | null)[];
    confirm: () => Promise<boolean>;
    cancel: () => void;
    clear: () => Promise<boolean>;
  }) => any;
  shortcut?: (context: { shortcut: HysDateShortcut; index: number }) => any;
  "range-separator"?: () => any;
}
export type HysDateRangePickerInstance<
  V extends HysDatePickerValue = HysDateRangeValue,
> = HysDatePickerInstance<V>;
export const datePickerDefaults = {
  open: undefined,
  showConfirm: undefined,
  type: "date",
  clearable: false,
  editable: false,
  bordered: true,
  firstDayOfWeek: 1,
  locale: "zh-CN",
  showAdjacentDays: true,
  showToday: true,
  showNow: true,
  showFooter: true,
  showSeconds: true,
  singlePanel: true,
  rangeSeparator: " 至 ",
  hourStep: 1,
  minuteStep: 1,
  secondStep: 1,
  rangeValidation: "endpoints",
  validateEvent: true,
  appendTo: "body",
} as const;
export const datePickerWords: HysDatePickerLocale = {
  today: "今天",
  now: "此刻",
  clear: "清空",
  cancel: "取消",
  close: "关闭",
  confirm: "确定",
  start: "开始日期",
  end: "结束日期",
  chooseStart: "请选择开始日期",
  chooseEnd: "请选择结束日期",
  invalid: "请选择有效日期",
  week: "周",
  year: "选择年份",
  month: "选择月份",
  back: "返回日期",
  prevMonth: "上个月",
  nextMonth: "下个月",
  prevYear: "上一年",
  nextYear: "下一年",
  hour: "时",
  minute: "分",
  second: "秒",
  empty: "选择日期",
  limit: "最多选择 {count} 项",
};
export const datePickerEnglish: HysDatePickerLocale = {
  today: "Today",
  now: "Now",
  clear: "Clear",
  cancel: "Cancel",
  close: "Close",
  confirm: "OK",
  start: "Start date",
  end: "End date",
  chooseStart: "Choose a start date",
  chooseEnd: "Choose an end date",
  invalid: "Choose a valid date",
  week: "Wk",
  year: "Choose year",
  month: "Choose month",
  back: "Back to dates",
  prevMonth: "Previous month",
  nextMonth: "Next month",
  prevYear: "Previous year",
  nextYear: "Next year",
  hour: "Hour",
  minute: "Minute",
  second: "Second",
  empty: "Choose a date",
  limit: "Select up to {count} items",
};
export const DATE_MIN = civilDay(1, 0, 1),
  DATE_MAX = civilDay(9999, 11, 31);
export const dateUnit = (type: string | undefined): HysDatePickerUnit =>
  type === "datetime" || !type
    ? "date"
    : (type.replace(/s$/, "") as HysDatePickerUnit);
export const dateMultiple = (type: string | undefined) =>
  ["dates", "months", "quarters", "years"].includes(type ?? "");
export function datePattern(type: string | undefined, time = false) {
  return time
    ? "YYYY-MM-DD HH:mm:ss"
    : dateUnit(type) === "year"
      ? "YYYY"
      : dateUnit(type) === "month"
        ? "YYYY-MM"
        : dateUnit(type) === "quarter"
          ? "YYYY-[Q]Q"
          : "YYYY-MM-DD";
}
export function datePeriod(
  day: number,
  unit: HysDatePickerUnit,
  first = 1,
): [number, number] {
  const p = calendarParts(day);
  if (unit === "year")
    return [civilDay(p.year, 0, 1), civilDay(p.year, 11, 31)];
  if (unit === "quarter") {
    const m = Math.floor(p.month / 3) * 3;
    return [civilDay(p.year, m, 1), civilDay(p.year, m + 3, 0)];
  }
  if (unit === "month")
    return [civilDay(p.year, p.month, 1), civilDay(p.year, p.month + 1, 0)];
  if (unit === "week") {
    const start = day - ((p.weekday - first + 7) % 7);
    return [Math.max(DATE_MIN, start), Math.min(DATE_MAX, start + 6)];
  }
  return [day, day];
}
export function dateTimeString(second: number) {
  return [Math.floor(second / 3600), Math.floor(second / 60) % 60, second % 60]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}
export function dateTimeSeconds(value: string | undefined) {
  const m = /^(\d{2}):(\d{2})(?::(\d{2}))?$/.exec(value ?? "");
  return m && +m[1] < 24 && +m[2] < 60 && +(m[3] ?? 0) < 60
    ? +m[1] * 3600 + +m[2] * 60 + +(m[3] ?? 0)
    : 0;
}
const TOKEN = /\[[^\]]*\]|YYYY|GGGG|MM|DD|HH|mm|ss|WW|Q/g;
export function dateFormat(point: HysDatePoint, pattern: string) {
  const p = calendarParts(point.day),
    weekYear = calendarParts(point.day + 3 - ((p.weekday + 6) % 7)).year;
  const values: Record<string, string> = {
    YYYY: String(p.year).padStart(4, "0"),
    GGGG: String(weekYear).padStart(4, "0"),
    MM: String(p.month + 1).padStart(2, "0"),
    DD: String(p.day).padStart(2, "0"),
    HH: String(Math.floor(point.second / 3600)).padStart(2, "0"),
    mm: String(Math.floor(point.second / 60) % 60).padStart(2, "0"),
    ss: String(point.second % 60).padStart(2, "0"),
    WW: String(calendarWeek(point.day)).padStart(2, "0"),
    Q: String(Math.floor(p.month / 3) + 1),
  };
  return pattern.replace(TOKEN, (t) =>
    t.startsWith("[") ? t.slice(1, -1) : values[t],
  );
}
export function datePoint(
  value: unknown,
  pattern = "YYYY-MM-DD",
): HysDatePoint | undefined {
  if (value instanceof Date || typeof value === "number") {
    const date = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(date.getTime())) return;
    const day = calendarDay(date);
    if (day === undefined) return;
    return {
      day,
      second:
        date.getHours() * 3600 + date.getMinutes() * 60 + date.getSeconds(),
    };
  }
  if (typeof value !== "string" || !value.trim()) return;
  if (pattern === "x" || pattern === "X") {
    if (!/^-?\d+(?:\.\d+)?$/.test(value)) return;
    return datePoint(Number(value) * (pattern === "X" ? 1000 : 1));
  }
  const parts: Record<string, number> = {},
    tokens: string[] = [];
  let last = 0,
    source = "";
  for (const match of pattern.matchAll(TOKEN)) {
    source += escapeRegExp(pattern.slice(last, match.index));
    const token = match[0];
    if (token.startsWith("[")) source += escapeRegExp(token.slice(1, -1));
    else {
      tokens.push(token);
      source +=
        token === "Q"
          ? "(\\d)"
          : token === "YYYY" || token === "GGGG"
            ? "(\\d{4})"
            : "(\\d{2})";
    }
    last = match.index! + token.length;
  }
  source += escapeRegExp(pattern.slice(last));
  const match = new RegExp("^" + source + "$").exec(value);
  if (
    !match ||
    !tokens.some((t) => t === "YYYY" || t === "GGGG") ||
    new Set(tokens).size !== tokens.length
  )
    return;
  tokens.forEach((token, i) => (parts[token] = +match[i + 1]));
  const y = parts.YYYY ?? parts.GGGG,
    m = parts.MM ?? (parts.Q ? (parts.Q - 1) * 3 + 1 : 1),
    d = parts.DD ?? 1,
    h = parts.HH ?? 0,
    min = parts.mm ?? 0,
    s = parts.ss ?? 0;
  if (
    y < 1 ||
    y > 9999 ||
    m < 1 ||
    m > 12 ||
    d < 1 ||
    d > 31 ||
    h > 23 ||
    min > 59 ||
    s > 59 ||
    (parts.Q !== undefined && (parts.Q < 1 || parts.Q > 4))
  )
    return;
  let day = civilDay(y, m - 1, d);
  if (parts.WW !== undefined) {
    if (parts.WW < 1 || parts.WW > 53) return;
    const jan4 = civilDay(y, 0, 4);
    day = jan4 - ((calendarParts(jan4).weekday + 6) % 7) + (parts.WW - 1) * 7;
    if (calendarWeek(day) !== parts.WW) return;
  } else if (calendarParts(day).month !== m - 1 || calendarParts(day).day !== d)
    return;
  if (day < DATE_MIN || day > DATE_MAX) return;
  return { day, second: h * 3600 + min * 60 + s };
}
function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
export function dateNative(point: HysDatePoint) {
  const date = calendarDate(point.day);
  date.setHours(
    Math.floor(point.second / 3600),
    Math.floor(point.second / 60) % 60,
    point.second % 60,
    0,
  );
  return date;
}
export function dateEqual(
  a: HysDatePickerValue | undefined,
  b: HysDatePickerValue | undefined,
): boolean {
  if (a instanceof Date && b instanceof Date)
    return a.getTime() === b.getTime();
  if (Array.isArray(a) && Array.isArray(b))
    return (
      a.length === b.length && a.every((value, i) => dateEqual(value, b[i]))
    );
  return Object.is(a, b);
}
export function dateClone<V extends HysDatePickerValue>(value: V): V {
  return (
    value instanceof Date
      ? new Date(value)
      : Array.isArray(value)
        ? value.map((v) => (v instanceof Date ? new Date(v) : v))
        : value
  ) as V;
}
export function dateLocale(locale: string) {
  try {
    return new Intl.DateTimeFormat(locale, { month: "long" });
  } catch {
    return new Intl.DateTimeFormat("zh-CN", { month: "long" });
  }
}
export function dateShift(day: number, months: number) {
  return Math.max(DATE_MIN, Math.min(DATE_MAX, calendarShift(day, months)));
}
