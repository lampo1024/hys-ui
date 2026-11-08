import type { Component, CSSProperties } from "vue";
import type { HysChoiceOption, HysChoiceValue } from "./choice";
export interface HysSegmentedOption<
  T extends HysChoiceValue = HysChoiceValue,
> extends HysChoiceOption<T> {
  icon?: Component | string;
  title?: string;
  className?: string;
  style?: CSSProperties;
}
export interface HysSegmentedInstance {
  element: HTMLElement | undefined;
  value: HysChoiceValue | null;
  focus: (value?: HysChoiceValue) => void;
  blur: () => void;
  select: (value: HysChoiceValue) => Promise<boolean>;
}
