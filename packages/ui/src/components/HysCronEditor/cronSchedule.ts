import type { CalendarCron } from "./cronValidation";
import { cronClock } from "./cronTimeZone";

const daySeconds = 86_400;

function lastDayOf(date: Date) {
  const monthEnd = new Date(date);
  monthEnd.setUTCMonth(date.getUTCMonth() + 1, 0);
  return monthEnd.getUTCDate();
}

function closestWeekday(date: Date, target: number, last: number) {
  if (target < 1 || target > last) return -1;
  const weekday = (date.getUTCDay() + target - date.getUTCDate() + 35) % 7;
  if (weekday === 6) return target === 1 ? 3 : target - 1;
  if (weekday === 0) return target === last ? target - 2 : target + 1;
  return target;
}

function matchesDay(plan: CalendarCron, date: Date) {
  const { fields, format } = plan;
  const day = date.getUTCDate(), weekday = date.getUTCDay();
  const year = date.getUTCFullYear();
  if (!fields.month.values.includes(date.getUTCMonth() + 1) ||
      (fields.year.values.length && !fields.year.values.includes(year))) return false;
  const dayMatch = fields.day.unspecified || fields.day.values.includes(day);
  const weekMatch = fields.weekday.unspecified || fields.weekday.values.includes(weekday);
  if (format === "unix")
    return fields.day.wildcard || fields.weekday.wildcard ? dayMatch && weekMatch : dayMatch || weekMatch;
  if (dayMatch && weekMatch) return true;
  const last = lastDayOf(date);
  if (fields.weekday.unspecified) {
    return fields.day.rules.some(rule => {
      if (rule.kind === "monthEnd") return day === last - rule.offset;
      if (rule.kind === "monthEndWeekday") return day === closestWeekday(date, last - rule.offset, last);
      return rule.kind === "nearestWeekday" && day === closestWeekday(date, rule.day, last);
    });
  }
  return fields.weekday.rules.some(rule => {
    if (rule.kind === "lastWeekday") return weekday === rule.weekday && day + 7 > last;
    return rule.kind === "nthWeekday" && weekday === rule.weekday && Math.ceil(day / 7) === rule.occurrence;
  });
}

function lowerBound(values: readonly number[], minimum: number) {
  let first = 0, last = values.length;
  while (first < last) {
    const middle = Math.floor((first + last) / 2);
    if (values[middle] < minimum) first = middle + 1;
    else last = middle;
  }
  return first;
}

export function cronRuns(plan: CalendarCron, start: Date, limit: number, timeZone = "UTC"): Date[] {
  let upcoming: number[] = [];
  const instant = Math.floor(start.getTime() / 1000);
  const clock = cronClock(timeZone);
  if (!clock || !Number.isFinite(instant) || !Number.isFinite(limit) || limit < 1) return [];
  const firstDay = Math.floor((instant + clock.offsetAt(instant)) / daySeconds) * daySeconds;
  const years = plan.fields.year.values;
  const end = years.length ? Date.UTC(years.at(-1)! + 1, 0, 1) / 1000 : firstDay + (366 * 5 + 1) * daySeconds;
  const count = Math.min(100, Math.floor(limit));
  const { hour, minute, second } = plan.fields;
  const times = hour.values.flatMap(h => minute.values.flatMap(m => second.values.map(s => h * 3600 + m * 60 + s)));
  // A backward transition near midnight can repeat part of the previous local date.
  for (let day = firstDay - (clock.isUtc ? 0 : daySeconds); day < end; day += daySeconds) {
    const earliest = day - (clock.isUtc ? 0 : daySeconds);
    if (upcoming.length === count && upcoming.at(-1)! < earliest) break;
    if (!matchesDay(plan, new Date(day * 1000))) continue;
    const matches: number[] = [];
    for (const period of clock.intervals(day)) {
      const first = Math.max(day, period.start + period.offset, instant + 1 + period.offset);
      const endOfPeriod = Math.min(day + daySeconds, period.end + period.offset);
      for (let index = lowerBound(times, first - day); index < times.length && day + times[index] < endOfPeriod; index++) {
        matches.push(day + times[index] - period.offset);
        if (matches.length === count) break;
      }
      if (matches.length === count) break;
    }
    upcoming = [...upcoming, ...matches].sort((a, b) => a - b).slice(0, count);
  }
  return upcoming.map(seconds => new Date(seconds * 1000));
}
