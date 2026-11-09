export type HysCalendarValue = string | Date;
export type HysCalendarMode = "month" | "year";
export type HysCalendarTransition =
  "none" | "fade" | "slide" | "slide-up" | "zoom";
export type HysCalendarAction =
  "prev-month" | "next-month" | "prev-year" | "next-year" | "today";
export interface CalendarEvent {
  id: string;
  date: string;
  title: string;
  end?: string;
  time?: string;
  color?: string;
  disabled?: boolean;
  description?: string;
}
export interface HysCalendarSelectInfo {
  source: "date" | "month" | "keyboard" | "customize";
}
export interface HysCalendarCell {
  day: string;
  date: Date;
  type: "prev-month" | "current-month" | "next-month";
  isSelected: boolean;
  isToday: boolean;
  disabled: boolean;
  events: CalendarEvent[];
}
export interface HysCalendarMonthCell {
  month: number;
  date: Date;
  day: string;
  isSelected: boolean;
  isToday: boolean;
  disabled: boolean;
  events: CalendarEvent[];
}
export interface HysCalendarInstance<T extends HysCalendarValue = string> {
  readonly element: HTMLElement | undefined;
  readonly selectedDay: T | undefined;
  readonly panelValue: T;
  readonly currentMode: HysCalendarMode;
  readonly visibleRange: readonly [string, string];
  pickDay: (value: HysCalendarValue) => Promise<boolean>;
  selectDate: (action: HysCalendarAction) => boolean;
  showMonth: (value: HysCalendarValue) => boolean;
  setMode: (mode: HysCalendarMode) => boolean;
  focus: () => Promise<void>;
}
const DAY = 86400000;
export function calendarDay(
  value: HysCalendarValue | undefined,
  format = "YYYY-MM-DD",
): number | undefined {
  if (value instanceof Date) {
    if (!Number.isFinite(value.getTime())) return;
    return civilDay(value.getFullYear(), value.getMonth(), value.getDate());
  }
  if (typeof value !== "string") return;
  let match: string[] | null = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match && format !== "YYYY-MM-DD") {
    const tokens: string[] = [];
    const pattern = format
      .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      .replace(/YYYY|MM|DD/g, (token) => {
        tokens.push(token);
        return token === "YYYY" ? "(\\d{4})" : "(\\d{2})";
      });
    if (tokens.length !== 3 || new Set(tokens).size !== 3) return;
    const custom = new RegExp("^" + pattern + "$").exec(value);
    if (custom)
      match = [
        custom[0],
        custom[tokens.indexOf("YYYY") + 1],
        custom[tokens.indexOf("MM") + 1],
        custom[tokens.indexOf("DD") + 1],
      ];
  }
  if (!match) return;
  const y = +match[1],
    m = +match[2] - 1,
    d = +match[3];
  if (y < 1 || y > 9999 || m < 0 || m > 11 || d < 1 || d > 31) return;
  const day = civilDay(y, m, d),
    date = new Date(day * DAY);
  if (
    date.getUTCFullYear() === y &&
    date.getUTCMonth() === m &&
    date.getUTCDate() === d
  )
    return day;
}
export function civilDay(y: number, m: number, d: number) {
  const value = new Date(0);
  value.setUTCFullYear(y, m, d);
  value.setUTCHours(0, 0, 0, 0);
  return value.getTime() / DAY;
}
export function calendarParts(day: number) {
  const d = new Date(day * DAY);
  return {
    year: d.getUTCFullYear(),
    month: d.getUTCMonth(),
    day: d.getUTCDate(),
    weekday: d.getUTCDay(),
  };
}
export function calendarISO(day: number) {
  const p = calendarParts(day);
  return `${String(p.year).padStart(4, "0")}-${String(p.month + 1).padStart(2, "0")}-${String(p.day).padStart(2, "0")}`;
}
export function calendarDate(day: number) {
  const p = calendarParts(day),
    d = new Date(0);
  d.setFullYear(p.year, p.month, p.day);
  d.setHours(0, 0, 0, 0);
  return d;
}
export function calendarFormat(day: number, format: string) {
  const p = calendarParts(day);
  return format.replace(/YYYY|MM|DD/g, (t) =>
    t === "YYYY"
      ? String(p.year).padStart(4, "0")
      : String(t === "MM" ? p.month + 1 : p.day).padStart(2, "0"),
  );
}
export function calendarShift(day: number, months: number) {
  const p = calendarParts(day),
    start = calendarParts(civilDay(p.year, p.month + months, 1)),
    last = calendarParts(civilDay(start.year, start.month + 1, 0)).day;
  return civilDay(start.year, start.month, Math.min(p.day, last));
}
export function calendarWeeks(
  start: number,
  end: number,
  first: number,
): [number, number] {
  return [
    start - ((calendarParts(start).weekday - first + 7) % 7),
    end + ((first + 6 - calendarParts(end).weekday + 7) % 7),
  ];
}
export function calendarWeek(day: number) {
  const weekday = (calendarParts(day).weekday + 6) % 7,
    thursday = day + 3 - weekday,
    year = calendarParts(thursday).year;
  return 1 + Math.floor((thursday - civilDay(year, 0, 1)) / 7);
}
/** Index only the bounded visible window, including intersecting multi-day events. */
export function calendarEvents(
  events: readonly CalendarEvent[],
  start: number,
  end: number,
) {
  const dates = new Map<number, CalendarEvent[]>(),
    months = new Map<number, CalendarEvent[]>();
  for (const event of events) {
    const from = calendarDay(event.date),
      to = calendarDay(event.end ?? event.date);
    if (
      from === undefined ||
      to === undefined ||
      to < from ||
      to < start ||
      from > end
    )
      continue;
    const seen = new Set<number>();
    for (let day = Math.max(from, start); day <= Math.min(to, end); day++) {
      const list = dates.get(day) ?? [];
      list.push(event);
      dates.set(day, list);
      const p = calendarParts(day),
        key = p.year * 12 + p.month;
      if (!seen.has(key)) {
        const group = months.get(key) ?? [];
        group.push(event);
        months.set(key, group);
        seen.add(key);
      }
    }
  }
  return { dates, months };
}
