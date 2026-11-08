import type { ComputedRef, InjectionKey, Ref } from "vue";
export type HysChoiceValue = string | number | boolean;
export interface HysChoiceFieldNames {
  label?: string;
  value?: string;
  disabled?: string;
  indeterminate?: string;
}
export interface HysChoiceOption<T extends HysChoiceValue = HysChoiceValue> {
  label: string;
  value: T;
  disabled?: boolean;
  indeterminate?: boolean;
  [key: string]: unknown;
}
export type HysChoiceDataOption<T extends HysChoiceValue = HysChoiceValue> =
  T | HysChoiceOption<T> | Record<string, unknown>;
export interface HysCheckboxReject {
  value?: HysChoiceValue;
  checked?: boolean;
  reason: "min" | "max" | "range";
}
export interface HysCheckboxChange {
  value?: HysChoiceValue;
  checked?: boolean;
  source: "toggle" | "all" | "clear";
}
export interface HysCheckboxInstance {
  input: HTMLInputElement | undefined;
  checked: boolean;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  toggle: () => Promise<boolean>;
}
export interface HysCheckboxGroupInstance {
  values: HysChoiceValue[];
  allChecked: boolean;
  indeterminate: boolean;
  focus: (value?: HysChoiceValue) => void;
  blur: () => void;
  checkAll: () => Promise<boolean>;
  clear: () => Promise<boolean>;
  toggle: (value: HysChoiceValue, checked?: boolean) => Promise<boolean>;
}
interface CheckboxRegistration {
  input: Ref<HTMLInputElement | undefined>;
  value: ComputedRef<HysChoiceValue | undefined>;
  locked: ComputedRef<boolean>;
  disabled: ComputedRef<boolean>;
}
export interface HysCheckboxGroupContext {
  values: ComputedRef<HysChoiceValue[]>;
  disabled: ComputedRef<boolean>;
  readonly: ComputedRef<boolean>;
  size: ComputedRef<"sm" | "md" | "lg">;
  button: ComputedRef<boolean>;
  border: ComputedRef<boolean>;
  solid: ComputedRef<boolean>;
  status: ComputedRef<string | undefined>;
  form: ComputedRef<string | undefined>;
  isLimited: (value: HysChoiceValue) => boolean;
  toggle: (value: HysChoiceValue, checked: boolean) => Promise<boolean>;
  register: (record: CheckboxRegistration) => () => void;
}
export const checkboxGroupKey: InjectionKey<HysCheckboxGroupContext> = Symbol(
  "hys-ui-checkbox-group",
);
export function isChoice(value: unknown): value is HysChoiceValue {
  return (
    typeof value === "string" ||
    typeof value === "boolean" ||
    (typeof value === "number" && Number.isFinite(value))
  );
}
export function choiceKey(value: HysChoiceValue) {
  return typeof value + ":" + String(value);
}
export function uniqueChoices(values: readonly unknown[]) {
  return Array.isArray(values) ? [...new Set(values.filter(isChoice))] : [];
}
export function choiceOptions<T extends HysChoiceValue>(
  source: readonly HysChoiceDataOption<T>[],
  fields: HysChoiceFieldNames = {},
): HysChoiceOption<T>[] {
  const seen = new Set<string>(),
    result: HysChoiceOption<T>[] = [];
  if (!Array.isArray(source)) return result;
  for (const raw of source) {
    const data = isChoice(raw) ? { label: String(raw), value: raw } : raw;
    if (!data || typeof data !== "object") continue;
    const value = data[fields.value ?? "value"];
    if (!isChoice(value) || seen.has(choiceKey(value))) continue;
    seen.add(choiceKey(value));
    result.push({
      ...data,
      label: String(data[fields.label ?? "label"] ?? value),
      value: value as T,
      disabled: !!data[fields.disabled ?? "disabled"],
      indeterminate: !!data[fields.indeterminate ?? "indeterminate"],
    });
  }
  return result;
}
export interface HysRadioInstance {
  input: HTMLInputElement | undefined;
  checked: boolean;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  select: () => Promise<boolean>;
}
export interface HysRadioGroupInstance {
  value: HysChoiceValue | null;
  focus: (value?: HysChoiceValue) => void;
  blur: () => void;
  select: (value: HysChoiceValue) => Promise<boolean>;
}
export interface HysRadioGroupContext {
  value: ComputedRef<HysChoiceValue | null>;
  disabled: ComputedRef<boolean>;
  readonly: ComputedRef<boolean>;
  required: ComputedRef<boolean>;
  size: ComputedRef<"sm" | "md" | "lg">;
  button: ComputedRef<boolean>;
  border: ComputedRef<boolean>;
  solid: ComputedRef<boolean>;
  name: ComputedRef<string>;
  form: ComputedRef<string | undefined>;
  status: ComputedRef<string | undefined>;
  select: (value: HysChoiceValue) => Promise<boolean>;
  tabindex: (value: HysChoiceValue) => number;
  register: (record: CheckboxRegistration) => () => void;
}
export const radioGroupKey: InjectionKey<HysRadioGroupContext> =
  Symbol("hys-ui-radio-group");
export interface HysSwitchGuardContext {
  signal: AbortSignal;
}
export interface HysSwitchInstance {
  element: HTMLButtonElement | undefined;
  checked: boolean;
  pending: boolean;
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  toggle: () => Promise<boolean>;
}
