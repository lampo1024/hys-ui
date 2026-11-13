import type { VNode, VNodeChild } from "vue";

export type HysSpaceGap = number | string;
export interface HysSpaceProps {
  direction?: "horizontal" | "vertical";
  size?: HysSpaceGap | readonly [inline: HysSpaceGap, block: HysSpaceGap];
  align?: "start" | "center" | "end" | "baseline" | "stretch";
  justify?: "start" | "center" | "end" | "between" | "around" | "evenly";
  wrap?: boolean;
  block?: boolean;
  fill?: boolean;
  fillRatio?: number;
  separator?: string;
}
export interface HysSpaceSlots {
  default?: () => VNode[];
  separator?: (context: { index: number; count: number }) => VNodeChild;
}
