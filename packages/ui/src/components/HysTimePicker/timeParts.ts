import { dateTimeSeconds, dateTimeString } from "../../composables/datePicker";

export interface TimeRules {
  showSeconds?: boolean;
  minTime?: string;
  maxTime?: string;
  minuteStep?: number;
  secondStep?: number;
  disabledTime?: (time: string) => boolean;
}

export function parseTime(text: string, seconds?: boolean) {
  const matched = (
    seconds
      ? /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/u
      : /^(?:[01]\d|2[0-3]):[0-5]\d$/u
  ).test(text);
  return matched ? dateTimeSeconds(text) : undefined;
}

export function formatTime(seconds: number, showSeconds?: boolean) {
  const time = dateTimeString(seconds);
  return showSeconds ? time : time.slice(0, 5);
}

export function parseTimeInput(
  text: string,
  seconds?: boolean,
  twelveHour?: boolean,
) {
  if (twelveHour) {
    const match =
      /^(0?[1-9]|1[0-2]):([0-5]\d)(?::([0-5]\d))?\s*(am|pm)$/iu.exec(text);
    if (match && Boolean(match[3]) === Boolean(seconds))
      return (
        ((Number(match[1]) % 12) + (match[4].toLowerCase() === "pm" ? 12 : 0)) *
          3600 +
        Number(match[2]) * 60 +
        Number(match[3] ?? 0)
      );
  }
  return parseTime(text, seconds);
}

export function formatTimeInput(
  time: number,
  seconds?: boolean,
  twelveHour?: boolean,
) {
  const canonical = formatTime(time, seconds);
  if (!twelveHour) return canonical;
  const hour = Math.floor(time / 3600);
  return `${String(hour % 12 || 12).padStart(2, "0")}${canonical.slice(2)} ${hour < 12 ? "AM" : "PM"}`;
}

function bound(text: string | undefined, fallback: number) {
  if (text === undefined) return fallback;
  return parseTime(text, text.length === 8) ?? fallback;
}

function increment(step: number | undefined) {
  return typeof step === "number" && Number.isFinite(step)
    ? Math.max(1, Math.min(60, Math.trunc(step)))
    : 1;
}

export function createTimeOptions(rules: TimeRules) {
  const start = bound(rules.minTime, 0);
  const end = bound(rules.maxTime, 86399);
  const minuteStep = increment(rules.minuteStep);
  const secondStep = rules.showSeconds ? increment(rules.secondStep) : 60;
  const hours = new Map<number, Map<number, number[]>>();
  for (
    let hour = Math.floor(start / 3600);
    hour <= Math.floor(end / 3600);
    hour++
  ) {
    const minutes = new Map<number, number[]>();
    for (let minute = 0; minute < 60; minute += minuteStep) {
      const base = hour * 3600 + minute * 60;
      if (base > end || base + 59 < start) continue;
      const seconds = [];
      for (let second = 0; second < 60; second += secondStep) {
        if (
          base + second >= start &&
          base + second <= end &&
          !rules.disabledTime?.(formatTime(base + second, rules.showSeconds))
        )
          seconds.push(second);
      }
      if (seconds.length) minutes.set(minute, seconds);
    }
    if (minutes.size) hours.set(hour, minutes);
  }
  return hours;
}

export function timeParts(time: number) {
  return [
    Math.floor(time / 3600),
    Math.floor(time / 60) % 60,
    time % 60,
  ] as const;
}

export function usesTime(
  options: ReturnType<typeof createTimeOptions>,
  time: number,
) {
  const [hour, minute, second] = timeParts(time);
  return !!options.get(hour)?.get(minute)?.includes(second);
}

export function firstTime(options: ReturnType<typeof createTimeOptions>) {
  const first = options.entries().next().value;
  if (!first) return undefined;
  const [hour, minutes] = first;
  const minute = minutes.entries().next().value;
  return minute ? hour * 3600 + minute[0] * 60 + minute[1][0] : undefined;
}
