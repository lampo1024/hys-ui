import type { CSSProperties, VNodeChild } from "vue";
import type { HysFormGridValue } from "../../composables/formLayout";

export type HysDescriptionValue =
  string | number | boolean | bigint | null | undefined;
export type HysDescriptionAlign = "start" | "center" | "end";
export type HysDescriptionsColumns = HysFormGridValue;
export interface HysDescriptionItem {
  key: string | number;
  label: string;
  value?: HysDescriptionValue;
  span?: number | "full";
  rowSpan?: number;
  hidden?: boolean;
  labelWidth?: number | string;
  align?: HysDescriptionAlign;
  labelAlign?: HysDescriptionAlign;
  labelClass?: string;
  contentClass?: string;
  labelStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  format?: (
    value: HysDescriptionValue,
    item: HysDescriptionItem,
  ) => HysDescriptionValue;
}
export interface HysDescriptionsProps {
  items?: readonly HysDescriptionItem[];
  title?: string;
  extra?: string;
  columns?: HysDescriptionsColumns;
  layout?: "horizontal" | "vertical";
  size?: "sm" | "md" | "lg";
  bordered?: boolean;
  colon?: boolean;
  labelWidth?: number | string;
  labelAlign?: HysDescriptionAlign;
  align?: HysDescriptionAlign;
  labelStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  placeholder?: string;
  emptyText?: string;
  ariaLabel?: string;
}
export interface HysDescriptionContext {
  item: HysDescriptionItem;
  index: number;
  value: HysDescriptionValue;
  text: string;
}
export interface HysDescriptionsSlots {
  title?: () => VNodeChild;
  extra?: () => VNodeChild;
  label?: (context: HysDescriptionContext) => VNodeChild;
  value?: (context: HysDescriptionContext) => VNodeChild;
  empty?: () => VNodeChild;
  [name: `label-${string}`]:
    ((context: HysDescriptionContext) => VNodeChild) | undefined;
  [name: `value-${string}`]:
    ((context: HysDescriptionContext) => VNodeChild) | undefined;
}
