import type { HysSpreadsheetSheet } from "./spreadsheetTypes";

export function validSortRowOrder(
  order: unknown,
  count: number,
): order is readonly number[] {
  return (
    Array.isArray(order) &&
    order.length === count &&
    new Set(order).size === count &&
    order.every(
      (index) => Number.isInteger(index) && index >= 0 && index < count,
    )
  );
}

export function shiftSortRowOrder(
  sheet: HysSpreadsheetSheet,
  index: number,
  add: boolean,
  count: number,
) {
  const order = sheet.sortRowOrder;
  if (!order) return;
  if (add) {
    const next = order.map((position) =>
      position < index ? position : position + count,
    );
    next.splice(
      index,
      0,
      ...Array.from({ length: count }, (_, offset) => index + offset),
    );
    return next;
  }

  const remaining = order.filter(
    (_, row) => row < index || row >= index + count,
  );
  const positions = new Map(
    remaining
      .slice()
      .sort((a, b) => a - b)
      .map((row, position) => [row, position]),
  );
  return remaining.map((row) => positions.get(row)!);
}

export function moveSortRowOrder(
  sheet: HysSpreadsheetSheet,
  order: readonly number[],
  from: number,
  to: number,
  count: number,
) {
  const base = sheet.sortRowOrder;
  if (!base) return;
  const moved = new Set(base.slice(from, from + count));
  const original = Array.from(
    { length: base.length },
    (_, position) => position,
  ).filter((position) => !moved.has(position));
  const following = order[to + count];
  const insertion =
    following === undefined
      ? original.length
      : original.indexOf(base[following]);
  original.splice(insertion, 0, ...moved);
  const positions = new Map(original.map((row, position) => [row, position]));
  return order.map((row) => positions.get(base[row])!);
}
