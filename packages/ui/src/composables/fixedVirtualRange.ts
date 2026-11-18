export function fixedVirtualRange(total: number, rowHeight: number, offset: number, viewport: number, overscan: number) {
  const visibleStart = Math.min(Math.max(0, total - 1), Math.floor(offset / rowHeight));
  const visibleEnd = Math.min(total - 1, Math.ceil((offset + viewport) / rowHeight) - 1);
  return {
    visibleStart, visibleEnd,
    start: Math.max(0, visibleStart - overscan),
    end: Math.min(total - 1, visibleEnd + overscan),
  };
}
