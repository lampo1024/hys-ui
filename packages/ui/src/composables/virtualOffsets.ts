/** Find the item that contains a scroll offset in a prefix-sum array. */
export function virtualOffsetIndex(offsets: readonly number[], point: number) {
  let low = 0;
  let high = offsets.length - 1;
  while (low < high) {
    const middle = Math.ceil((low + high) / 2);
    if (offsets[middle] <= point) low = middle;
    else high = middle - 1;
  }
  return Math.min(low, Math.max(0, offsets.length - 2));
}
