const fields = [
  { label: "分钟", minimum: 0, maximum: 59 },
  { label: "小时", minimum: 0, maximum: 23 },
  { label: "日", minimum: 1, maximum: 31 },
  { label: "月份", minimum: 1, maximum: 12 },
  { label: "星期", minimum: 0, maximum: 7 },
] as const;

export function validateCron(expression: string) {
  return parseCron(expression).error ?? "";
}

function parseCron(expression: string) {
  const parts = expression.trim().split(/\s+/);
  if (parts.length !== fields.length) return { error: "请输入五段 Cron 表达式" };
  const values: Set<number>[] = [];
  for (const [index, field] of fields.entries()) {
    const value = parts[index];
    const numbers = new Set<number>();
    const inRange = (number: string) =>
      Number(number) >= field.minimum && Number(number) <= field.maximum;
    for (const item of value.split(",")) {
      const match = /^(\*|\d+)(?:-(\d+))?(?:\/(\d+))?$/.exec(item);
      if (!match) return { error: field.label + "包含无效格式" };
      const [, start, end, step] = match;
      if (start !== "*" && !inRange(start)) return { error: field.label + "超出取值范围" };
      if (
        end !== undefined &&
        (start === "*" || !inRange(end) || Number(start) > Number(end))
      )
        return { error: field.label + "范围无效" };
      if (
        step !== undefined &&
        (!Number.isSafeInteger(Number(step)) || Number(step) < 1)
      )
        return { error: field.label + "步长必须为正整数" };
      const first = start === "*" ? field.minimum : Number(start);
      const last = end !== undefined ? Number(end) : start === "*" || step !== undefined ? field.maximum : first;
      for (let number = first; number <= last; number += Number(step ?? 1))
        numbers.add(index === 4 && number === 7 ? 0 : number);
    }
    values.push(numbers);
  }
  return { values, matchBoth: parts[2].startsWith("*") || parts[4].startsWith("*") };
}

export function nextCronRuns(expression: string, start: Date, limit: number) {
  const { values, matchBoth } = parseCron(expression);
  if (!values || !Number.isFinite(start.getTime()) || limit <= 0) return [];
  const [minutes, hours, days, months, weekdays] = values;
  const times = Array.from(hours).sort((a, b) => a - b).flatMap((hour) =>
    Array.from(minutes).sort((a, b) => a - b).map((minute) => hour * 60 + minute),
  );
  const date = new Date(start.getTime());
  date.setUTCHours(0, 0, 0, 0);
  const runs: Date[] = [];
  for (let offset = 0; offset <= 366 * 5; offset++, date.setUTCDate(date.getUTCDate() + 1)) {
    const day = days.has(date.getUTCDate());
    const weekday = weekdays.has(date.getUTCDay());
    if (!months.has(date.getUTCMonth() + 1) || !(matchBoth ? day && weekday : day || weekday)) continue;
    for (const time of times) {
      const stamp = date.getTime() + time * 60_000;
      if (stamp <= start.getTime() || !Number.isFinite(new Date(stamp).getTime())) continue;
      runs.push(new Date(stamp));
      if (runs.length === limit) return runs;
    }
  }
  return runs;
}
