import type { Component, VNodeChild } from "vue";
export type HysTimelineKey = string | number;
export type HysTimelineMode =
  "left" | "right" | "alternate" | "alternate-reverse";
export type HysTimelinePosition = "left" | "right";
export type HysTimelineSize = "sm" | "md" | "lg";
export type HysTimelineTone =
  "primary" | "success" | "warning" | "danger" | "info" | "neutral";
export interface HysTimelineItem {
  id?: HysTimelineKey;
  key?: HysTimelineKey;
  title: string;
  time?: string;
  dateTime?: string;
  description?: string;
  status?: "done" | "current" | "pending";
  color?: string;
  label?: string;
  position?: HysTimelinePosition;
  tone?: HysTimelineTone;
  size?: HysTimelineSize | number;
  hollow?: boolean;
  loading?: boolean;
  icon?: Component;
  hideTime?: boolean;
  timePlacement?: "top" | "bottom";
}
export type HysTimelineFieldNames = Partial<
  Record<keyof HysTimelineItem, string>
>;
export interface HysTimelineProps<T extends object = HysTimelineItem> {
  items: readonly T[];
  reverse?: boolean;
  pending?: string | boolean;
  mode?: HysTimelineMode;
  itemKey?: string | ((item: T, index: number) => HysTimelineKey);
  fieldNames?: HysTimelineFieldNames;
  size?: HysTimelineSize;
  hollow?: boolean;
  showTime?: boolean;
  timePlacement?: "top" | "bottom";
  responsive?: boolean;
  lineStyle?: "solid" | "dashed" | "dotted";
  lineColor?: string;
  pendingPosition?: "start" | "end";
  pendingLoading?: boolean;
  pendingText?: string;
  emptyText?: string;
  ariaLabel?: string;
}
export interface HysTimelineItemContext<T extends object = HysTimelineItem> {
  item: T;
  index: number;
  sourceIndex: number;
  key: HysTimelineKey;
  title: string;
  time: string;
  description: string;
  label: string;
  position: HysTimelinePosition;
  status: HysTimelineItem["status"];
  tone: HysTimelineTone;
  loading: boolean;
}
export interface HysTimelinePendingContext {
  pending: string | boolean | undefined;
  loading: boolean;
}
export interface HysTimelineSlots<T extends object = HysTimelineItem> {
  item?: (context: HysTimelineItemContext<T>) => VNodeChild;
  title?: (context: HysTimelineItemContext<T>) => VNodeChild;
  description?: (context: HysTimelineItemContext<T>) => VNodeChild;
  time?: (context: HysTimelineItemContext<T>) => VNodeChild;
  label?: (context: HysTimelineItemContext<T>) => VNodeChild;
  dot?: (context: HysTimelineItemContext<T>) => VNodeChild;
  pending?: (context: HysTimelinePendingContext) => VNodeChild;
  "pending-dot"?: (context: HysTimelinePendingContext) => VNodeChild;
  empty?: () => VNodeChild;
}
export interface HysTimelineInstance<T extends object = HysTimelineItem> {
  readonly element: HTMLOListElement | undefined;
  getItems: () => T[];
}
export function timelineRead(item: object, path: string) {
  return path
    .split(".")
    .reduce<unknown>(
      (value, key) =>
        value != null && typeof value === "object"
          ? (value as Record<string, unknown>)[key]
          : undefined,
      item,
    );
}
export const timelineText = (value: unknown) =>
  typeof value === "string" || typeof value === "number" ? String(value) : "";
export const timelineTone = (tone: HysTimelineTone) =>
  ({
    primary: "var(--hys-ui-primary,var(--hys-ui-theme-primary))",
    success: "var(--hys-ui-success,#16a46e)",
    warning: "var(--hys-ui-warning,#d9860c)",
    danger: "var(--hys-ui-red,var(--hys-ui-theme-red,#ed4556))",
    info: "var(--hys-ui-info,#3867f5)",
    neutral: "var(--hys-ui-muted,var(--hys-ui-theme-muted))",
  })[tone] || "var(--hys-ui-muted,var(--hys-ui-theme-muted))";
