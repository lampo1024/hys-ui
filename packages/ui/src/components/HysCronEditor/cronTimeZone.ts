const daySeconds = 86_400;

export function cronClock(timeZone: string) {
  try {
    const formatter = new Intl.DateTimeFormat("en-GB", {
      timeZone, hourCycle: "h23", calendar: "gregory", numberingSystem: "latn",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
    const isUtc = formatter.resolvedOptions().timeZone === "UTC";
    function offsetAt(seconds: number) {
      if (isUtc) return 0;
      const values = Object.fromEntries(formatter.formatToParts(new Date(seconds * 1000))
        .filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)]));
      const local = new Date(0);
      local.setUTCFullYear(values.year, values.month - 1, values.day);
      local.setUTCHours(values.hour, values.minute, values.second, 0);
      return local.getTime() / 1000 - seconds;
    }

    function intervals(day: number) {
      if (isUtc) return [{ start: day, end: day + daySeconds, offset: 0 }];
      const after = day + 2 * daySeconds;
      const result: { start: number; end: number; offset: number }[] = [];
      let start = day - daySeconds, offset = offsetAt(start);
      for (let bound = start + 6 * 3600; bound <= after; bound += 6 * 3600) {
        const next = offsetAt(bound);
        if (next === offset) continue;
        let left = bound - 6 * 3600, right = bound;
        while (left + 1 < right) {
          const middle = Math.floor((left + right) / 2);
          if (offsetAt(middle) === offset) left = middle;
          else right = middle;
        }
        result.push({ start, end: right, offset });
        start = right;
        offset = next;
      }
      result.push({ start, end: after, offset });
      return result;
    }

    return { offsetAt, intervals, isUtc };
  } catch {
    return undefined;
  }
}

export function cronRunFormatter(timeZone: string, withSeconds: boolean) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: withSeconds ? "2-digit" : undefined,
    timeZoneName: "shortOffset",
  });
}
