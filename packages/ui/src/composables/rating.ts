import type { Component } from "vue";
export type HysRatingIcon = Component | string;
export type HysRatingLevels<T> =
  readonly T[] | Record<number, T | { value: T; excluded?: boolean }>;
export interface HysRatingInstance {
  element: HTMLElement | undefined;
  value: number;
  hoverValue: number | null;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  setValue: (value: number) => Promise<boolean>;
  clear: () => Promise<boolean>;
  setCurrentValue: (value: number) => void;
  resetCurrentValue: () => void;
}
export function ratingLevel<T>(
  levels: HysRatingLevels<T> | undefined,
  value: number,
  low: number,
  high: number,
  fallback: T,
): T {
  if (Array.isArray(levels))
    return (
      levels[value <= low ? 0 : value >= high ? 2 : 1] ??
      levels.at(-1) ??
      fallback
    );
  if (!levels || typeof levels !== "object") return fallback;
  const items = Object.entries(levels)
    .filter(([key]) => Number.isFinite(Number(key)))
    .sort((a, b) => Number(a[0]) - Number(b[0]));
  let last = fallback;
  for (const [key, entry] of items) {
    const wrapped =
        entry &&
        typeof entry === "object" &&
        "value" in entry &&
        ("excluded" in entry ||
          Object.keys(entry).every((key) => key === "value")),
      item = wrapped ? (entry as { value: T }).value : (entry as T);
    last = item;
    if (
      value < Number(key) ||
      (value === Number(key) &&
        !(wrapped && (entry as { excluded?: boolean }).excluded))
    )
      return item;
  }
  return last;
}
