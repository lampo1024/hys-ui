import type { Component, CSSProperties, MaybeRefOrGetter, Ref } from "vue";
import type { HysTheme } from "../../config";

export type HysIconVariant =
  | "outline"
  | "filled"
  | "duotone"
  | "multicolor"
  | "round"
  | "sharp"
  | "bold"
  | "thin"
  | "gradient"
  | "flat"
  | "3d"
  | (string & {});
export type HysIconStatus =
  | "default"
  | "loading"
  | "success"
  | "error"
  | "warning"
  | "info"
  | (string & {});
export type HysIconAnimation =
  | "none"
  | "spin"
  | "rotate"
  | "pulse"
  | "bounce"
  | "shake"
  | "swing"
  | "wiggle"
  | "float"
  | "breathing"
  | "scale"
  | "fade"
  | "slide"
  | "flip"
  | "spring"
  | "heartbeat"
  | "blink"
  | "draw"
  | "morph"
  | "gradient"
  | "loading"
  | (string & {});
export interface HysIconSvgNode {
  tag: string;
  attrs?: Record<string, string | number>;
  children?: readonly HysIconSvgNode[];
}
export interface HysIconSvg {
  type: "svg";
  viewBox?: string;
  nodes: readonly HysIconSvgNode[];
}
export type HysIconSource =
  | HysIconSvg
  | { type: "sprite"; href: string; viewBox?: string }
  | { type: "image"; src: string; srcset?: string }
  | { type: "font"; glyph?: string; family?: string; className?: string }
  | { type: "text"; text: string }
  | {
      type: "component";
      component: Component;
      props?: Record<string, unknown>;
    };
export type HysIconLoader = () =>
  Promise<HysIconSource | { default: HysIconSource }> | HysIconSource;
export type HysIconAsset = HysIconSource | HysIconLoader;
export interface HysIconEntry {
  source?: HysIconAsset;
  variants?: Record<string, HysIconAsset>;
  label?: string;
  category?: string;
  keywords?: readonly string[];
  aliases?: readonly string[];
  directional?: boolean;
}
export interface HysIconLibrary {
  namespace: string;
  version?: string;
  icons: Record<string, HysIconAsset | HysIconEntry>;
}
export type HysIconConflict = "error" | "replace" | "keep";
export interface HysIconRecord {
  name: string;
  label: string;
  namespace: string;
  version?: string;
  category: string;
  variants: readonly string[];
  aliases: readonly string[];
  keywords: readonly string[];
  directional: boolean;
}
export interface HysIconSearch {
  namespace?: string;
  category?: string;
  variant?: string;
  fuzzy?: boolean;
}
export interface HysIconRegistry {
  readonly revision: Readonly<Ref<number>>;
  register(library: HysIconLibrary, conflict?: HysIconConflict): void;
  unregister(namespace: string): void;
  resolve(name: string): HysIconRecord | undefined;
  get(name: string, variant?: HysIconVariant): HysIconSource | undefined;
  load(name: string, variant?: HysIconVariant): Promise<HysIconSource>;
  preload(
    names: readonly string[],
    variant?: HysIconVariant,
    allowedOrigins?: readonly string[],
  ): Promise<PromiseSettledResult<HysIconSource>[]>;
  list(): HysIconRecord[];
  search(query: string, filter?: HysIconSearch): HysIconRecord[];
}
export type HysIconReference = string | HysIconSource;
export interface HysIconLayer {
  icon: HysIconReference;
  color?: string;
  size?: number | string;
  x?: number | string;
  y?: number | string;
  rotate?: number;
}
export interface HysIconProps {
  name?: string;
  source?: HysIconSource;
  variant?: HysIconVariant;
  registry?: HysIconRegistry;
  status?: HysIconStatus;
  statusIcons?: Record<string, HysIconReference>;
  fallback?: HysIconReference | false;
  loadingIcon?: HysIconReference | false;
  size?: number | string;
  width?: number | string;
  height?: number | string;
  fit?: "contain" | "cover" | "fill";
  color?: string;
  theme?: HysTheme | "system";
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  gradient?: readonly string[];
  opacity?: number;
  background?: string;
  shape?: "circle" | "square" | "rounded";
  radius?: number | string;
  border?: string;
  padding?: number | string;
  gap?: number | string;
  shadow?: string;
  glow?: string;
  rotate?: number;
  flipX?: boolean;
  flipY?: boolean;
  align?: "start" | "center" | "end";
  verticalAlign?: CSSProperties["verticalAlign"];
  directional?: boolean;
  animation?: HysIconAnimation;
  animateOn?: "always" | "hover" | "click" | "state";
  animated?: boolean;
  paused?: boolean;
  duration?: number;
  speed?: number;
  animationDelay?: number;
  iterations?: number | "infinite";
  easing?: string;
  morphTo?: string;
  animationStyle?: CSSProperties;
  decorative?: boolean;
  label?: string;
  clickable?: boolean;
  href?: string;
  target?: string;
  rel?: string;
  disabled?: boolean;
  readonly?: boolean;
  active?: boolean;
  selected?: boolean;
  tooltip?: string;
  badge?: number | string | boolean;
  badgePosition?: "top-start" | "top-end" | "bottom-start" | "bottom-end";
  badgeMax?: number;
  secondary?: HysIconReference;
  layers?: readonly HysIconLayer[];
  allowedOrigins?: readonly string[];
  picker?: boolean;
  allowUpload?: boolean;
  storageKey?: string;
  pickerLocale?: Partial<HysIconPickerLocale>;
}
export interface HysIconPickerLocale {
  search: string;
  library: string;
  category: string;
  variant: string;
  all: string;
  favorites: string;
  recent: string;
  popular: string;
  empty: string;
  previous: string;
  next: string;
  addFavorite: string;
  removeFavorite: string;
  copyName: string;
  copyCode: string;
  copySvg: string;
  copied: string;
  copyFailed: string;
  upload: string;
  imported: (count: number) => string;
}
export interface HysIconConfig {
  registry?: HysIconRegistry;
  defaults?: MaybeRefOrGetter<Partial<HysIconProps>>;
}
export interface HysIconContext {
  name?: string;
  status: HysIconStatus;
  variant: HysIconVariant;
  loading: boolean;
  source?: HysIconSource;
}
