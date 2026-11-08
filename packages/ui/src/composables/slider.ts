import type { CSSProperties } from "vue";
export type HysSliderValue = number | [number, number];
export type HysSliderStep = number | "mark" | null;
export type HysSliderMarks = Record<
  number,
  string | { label: string; style?: CSSProperties }
>;
export interface HysSliderDragInfo {
  index: number;
  track: boolean;
  cancelled: boolean;
}
export interface HysSliderInstance {
  element: HTMLElement | undefined;
  dragging: boolean;
  values: number[];
  focus: (index?: number) => void;
  blur: () => void;
  setValue: (value: HysSliderValue) => void;
  cancel: () => void;
}
