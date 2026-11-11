import type { HysNumberEffect } from "./animatedNumber";
import {
  hysNumberAnimationCatalog,
  type HysNumberAnimationEntry,
  type HysNumberAnimationName,
} from "./numberAnimationCatalog";

export interface HysNumberAnimationConfig {
  /** 内置名称、原有效果名称或 animationPresets 中的预设名。 */
  name: HysNumberAnimationName | HysNumberEffect | (string & {});
  /** 效果强度 0–2。 */
  strength?: number;
  /** 滚动圈数或重复次数 1–12。 */
  cycles?: number;
  /** 数位交错量，按总时长比例指定，范围 0–0.9。 */
  stagger?: number;
  /** 可复现的随机种子。 */
  seed?: number;
  /** 为有方向的效果选择滚动轴。 */
  axis?: "horizontal" | "vertical";
}

export type HysNumberAnimationItem =
  HysNumberAnimationConfig["name"] | HysNumberAnimationConfig;
export type HysNumberAnimation =
  HysNumberAnimationItem | readonly HysNumberAnimationItem[];
export type HysNumberAnimationPresets = Readonly<
  Record<string, HysNumberAnimation>
>;
export type HysNumberDigitAnimations = Readonly<
  Record<string, HysNumberAnimation>
>;

export interface ResolvedNumberAnimation extends Omit<
  HysNumberAnimationConfig,
  "name"
> {
  entry?: HysNumberAnimationEntry;
  effect?: HysNumberEffect;
}

const catalog = new Map(
  hysNumberAnimationCatalog.map((entry) => [entry.name as string, entry]),
);
const legacy = new Set<string>([
  "count",
  "odometer",
  "wheel",
  "flip",
  "slot",
  "random",
  "scramble",
  "fade",
  "scale",
  "bounce",
  "spring",
  "slide",
  "blur",
  "appear",
  "disappear",
  "flash",
  "highlight",
  "gradient",
]);

const clamp = (value: number | undefined, min: number, max: number) =>
  typeof value === "number" && Number.isFinite(value)
    ? Math.min(max, Math.max(min, value))
    : undefined;

function normalize(item: unknown): HysNumberAnimationConfig | undefined {
  const value =
    typeof item === "string"
      ? { name: item }
      : (item as HysNumberAnimationConfig);
  if (typeof value?.name !== "string" || !value.name.trim()) return;
  return {
    name: value.name.trim(),
    strength: clamp(value.strength, 0, 2),
    cycles: clamp(value.cycles, 1, 12),
    stagger: clamp(value.stagger, 0, 0.9),
    seed: clamp(value.seed, 0, 2147483647),
    axis:
      value.axis === "horizontal" || value.axis === "vertical"
        ? value.axis
        : undefined,
  };
}

function items(animation: unknown) {
  return (Array.isArray(animation) ? animation : [animation])
    .slice(0, 8)
    .map(normalize)
    .filter((value) => value !== undefined);
}

export function resolveNumberAnimation(
  animation: unknown,
  presets?: HysNumberAnimationPresets,
): ResolvedNumberAnimation[] {
  const resolved: ResolvedNumberAnimation[] = [];
  function visit(config: HysNumberAnimationConfig, ancestors: string[]) {
    if (
      resolved.length === 8 ||
      ancestors.length === 8 ||
      ancestors.includes(config.name)
    )
      return;
    const { name, ...overrides } = config;
    if (presets && Object.hasOwn(presets, name)) {
      for (const child of items(presets[name])) {
        const merged = { ...child };
        for (const key of Object.keys(
          overrides,
        ) as (keyof typeof overrides)[]) {
          if (overrides[key] !== undefined)
            Object.assign(merged, { [key]: overrides[key] });
        }
        visit(merged, [...ancestors, name]);
      }
      return;
    }
    const entry = catalog.get(name);
    if (entry) resolved.push({ ...overrides, entry });
    else if (legacy.has(name))
      resolved.push({ ...overrides, effect: name as HysNumberEffect });
  }
  for (const config of items(animation)) visit(config, []);
  return resolved;
}

/** 导入可复用的动画配置，名称在实际使用时按预设表解析。 */
export function parseHysNumberAnimation(
  json: string,
): readonly HysNumberAnimationConfig[] {
  return items(JSON.parse(json));
}

/** 导出动画配置。仅保存名称与可序列化参数。 */
export function stringifyHysNumberAnimation(
  animation: HysNumberAnimation,
): string {
  return JSON.stringify(items(animation), null, 2);
}
