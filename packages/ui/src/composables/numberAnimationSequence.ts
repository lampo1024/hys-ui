import { hysNumberAnimationCatalog } from "./numberAnimationCatalog";

export interface HysNumberSequenceStep {
  index: number;
  delay: number;
  duration: number;
  reverse: boolean;
}

const sequenceNames = new Map(
  hysNumberAnimationCatalog
    .filter(({ category }) => category === "sequence")
    .map(({ name, variant }) => [name as string, variant]),
);
const safe = (value: number | undefined, fallback: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.max(0, Math.min(max, value))
    : fallback;

/** 将多实例编排转换为每个实例的顺序、延迟、时长和播放方向。 */
export function createHysNumberSequence(
  name: string,
  count: number,
  options: {
    duration?: number;
    interval?: number;
    columns?: number;
    seed?: number;
  } = {},
): HysNumberSequenceStep[] {
  const length = Math.floor(safe(count, 0, 256));
  const duration = safe(options.duration, 650, 60000);
  const interval = safe(options.interval, 130, 60000);
  const cols = Math.max(1, Math.floor(safe(options.columns, 3, length)));
  const variant = sequenceNames.get(name) ?? 0;
  const seed = safe(options.seed, 17, 2147483647);
  const shuffle = Array.from({ length }, (_, index) => index);
  for (let i = shuffle.length - 1; i > 0; i--) {
    const j =
      ((Math.imul(i + 1, 0x85ebca6b) ^ Math.imul(seed + 1, 0xc2b2ae35)) >>> 0) %
      (i + 1);
    [shuffle[i], shuffle[j]] = [shuffle[j], shuffle[i]];
  }
  const ranks = new Map(shuffle.map((index, rank) => [index, rank]));
  return Array.from({ length }, (_, index) => {
    const edge = Math.min(index, length - index - 1);
    const distance = Math.floor(Math.abs(index - (length - 1) / 2));
    const row = Math.floor(index / cols),
      column = index % cols;
    const order = [
      index,
      row + column,
      Math.floor(index / 2),
      distance,
      edge,
      ranks.get(index)!,
      index,
      0,
      index % 2,
      index,
      index * 1.15,
      (index % 3) * 2,
      index + row,
      edge,
      row,
      row + column,
      row * cols + (row % 2 ? cols - 1 - column : column),
      ranks.get(index)!,
      row,
      column,
    ][variant];
    const delay = order * (variant === 9 ? duration : interval);
    const stagger = variant === 7 ? index * interval : 0;
    return {
      index: variant === 17 ? shuffle[index] : index,
      delay,
      duration:
        variant === 6
          ? Math.max(0, duration + Math.max(0, length - 1) * interval - delay)
          : duration + stagger,
      reverse: (variant === 8 || variant === 13) && index % 2 === 1,
    };
  });
}
