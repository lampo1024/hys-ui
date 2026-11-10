import type { Component, VNodeChild } from "vue";
import type { HysPopupMotionProps } from "../motion/popup";
export type HysTagInputReason =
  "keyboard" | "blur" | "separator" | "paste" | "api";
export interface HysTagInputAddContext {
  signal: AbortSignal;
  values: readonly string[];
  reason: HysTagInputReason;
}
export interface HysTagInputInvalid {
  value: string;
  reason: "duplicate" | "max" | "guard" | "error" | "maxlength" | "minlength";
  error?: Error;
}
export interface HysTagInputProps extends HysPopupMotionProps {
  modelValue?: readonly string[];
  defaultValue?: readonly string[];
  max?: number;
  placeholder?: string;
  disabled?: boolean;
  readonly?: boolean;
  size?: "sm" | "md" | "lg";
  addOnBlur?: boolean;
  separator?: string;
  delimiters?: string | readonly string[] | RegExp;
  trigger?: "Enter" | "Space" | "Tab" | readonly string[];
  beforeAdd?: (
    value: string,
    context: HysTagInputAddContext,
  ) => boolean | void | Promise<boolean | void>;
  allowDuplicates?: boolean;
  caseSensitive?: boolean;
  trim?: boolean;
  clearable?: boolean;
  clearIcon?: Component;
  tagTone?: "primary" | "success" | "warning" | "danger" | "neutral";
  tagEffect?: "light" | "dark" | "outline";
  tagRound?: boolean;
  draggable?: boolean;
  collapseTags?: boolean;
  maxCollapseTags?: number;
  collapseTagsTooltip?: boolean;
  overflowHeight?: number;
  maxTagTextLength?: number;
  maxlength?: number;
  minlength?: number;
  ariaLabel?: string;
  label?: string;
  name?: string;
  form?: string;
  autocomplete?: string;
  autofocus?: boolean;
  tabindex?: number;
  status?: "error" | "warning" | "success";
  error?: string;
  validateEvent?: boolean;
  inputProps?: Record<string, unknown>;
}
export interface HysTagInputSlotContext {
  values: readonly string[];
  draft: string;
  disabled: boolean;
  readonly: boolean;
  pending: boolean;
  add: (value?: string | string[]) => Promise<boolean>;
  clear: () => Promise<boolean>;
}
export interface HysTagInputTagContext {
  value: string;
  index: number;
  disabled: boolean;
  readonly: boolean;
  remove: () => Promise<boolean>;
}
export interface HysTagInputSlots {
  tag?: (context: HysTagInputTagContext) => VNodeChild;
  prefix?: (context: HysTagInputSlotContext) => VNodeChild;
  suffix?: (context: HysTagInputSlotContext) => VNodeChild;
  "clear-icon"?: (context: HysTagInputSlotContext) => VNodeChild;
  "remove-icon"?: (context: HysTagInputTagContext) => VNodeChild;
  "collapse-tag"?: (context: {
    count: number;
    values: readonly string[];
  }) => VNodeChild;
}
export interface HysTagInputInstance {
  readonly element: HTMLElement | undefined;
  readonly input: HTMLInputElement | undefined;
  readonly values: readonly string[];
  readonly draft: string;
  readonly pending: boolean;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  add: (value?: string | string[]) => Promise<boolean>;
  remove: (index: number) => Promise<boolean>;
  clear: () => Promise<boolean>;
  move: (from: number, to: number) => Promise<boolean>;
  setDraft: (value: string) => void;
}
export function splitTags(
  value: string,
  separator?: string | readonly string[] | RegExp,
) {
  if (!separator || (typeof separator === "string" && !separator.length))
    return [value];
  if (separator instanceof RegExp)
    return value
      .split(new RegExp(separator.source, separator.flags.replace(/[gy]/g, "")))
      .filter((v) => v !== undefined);
  const separators = (
    typeof separator === "string" ? [separator] : [...separator]
  )
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (!separators.length) return [value];
  return value.split(
    new RegExp(
      separators.map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|"),
      "u",
    ),
  );
}
