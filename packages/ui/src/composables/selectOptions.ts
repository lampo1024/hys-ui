import { toRaw } from "vue";
export type HysSelectValue =
  string | number | boolean | Record<string, unknown>;
export type HysSelectModelValue = HysSelectValue | HysSelectValue[] | null;
export interface HysSelectOption {
  label: string;
  value: HysSelectValue;
  disabled?: boolean;
  [key: string]: unknown;
}
export interface HysSelectGroup {
  label: string;
  options: HysSelectOption[];
  disabled?: boolean;
  [key: string]: unknown;
}
export type HysSelectDataOption =
  HysSelectOption | HysSelectGroup | Record<string, unknown>;
export interface HysSelectFieldNames {
  label?: string;
  value?: string;
  options?: string;
  disabled?: string;
}
export interface HysSelectSearchContext {
  signal: AbortSignal;
}
export interface HysSelectInstance {
  focus: () => void;
  blur: () => void;
  open: () => Promise<void>;
  close: () => void;
  scrollTo: (value: HysSelectValue) => void;
  retry: () => void;
  selected: HysSelectOption[];
  query: string;
  isOpen: boolean;
}
export interface HysSelectRow {
  key: string;
  option?: HysSelectOption;
  group?: string;
  index: number;
  created?: boolean;
}
export function selectKeyFactory(valueKey: () => string) {
  let next = 0;
  const ids = new WeakMap<object, number>();
  return (value: HysSelectValue): string => {
    if (value && typeof value === "object") {
      const raw = toRaw(value),
        key = valueKey()
          .split(".")
          .reduce<unknown>(
            (item, part) =>
              item &&
              typeof item === "object" &&
              Object.prototype.hasOwnProperty.call(item, part)
                ? (item as Record<string, unknown>)[part]
                : undefined,
            raw,
          );
      if (key !== undefined && key !== null && typeof key !== "object")
        return "object:" + typeof key + ":" + String(key);
      if (!ids.has(raw)) ids.set(raw, ++next);
      return "reference:" + ids.get(raw);
    }
    return typeof value + ":" + String(value);
  };
}
export function normalizeSelectOptions(
  options: readonly HysSelectDataOption[],
  names: HysSelectFieldNames,
  keyOf: (value: HysSelectValue) => string,
): HysSelectRow[] {
  const rows: HysSelectRow[] = [],
    keys = new Set<string>(),
    seen = new WeakSet<object>();
  let optionIndex = 0;
  const labelKey = names.label ?? "label",
    valueKey = names.value ?? "value",
    childrenKey = names.options ?? "options",
    disabledKey = names.disabled ?? "disabled";
  function visit(
    items: readonly HysSelectDataOption[],
    group?: string,
    disabled = false,
    path = "",
  ) {
    items.forEach((item, index) => {
      if (!item || typeof item !== "object") return;
      const children = item[childrenKey],
        blocked = disabled || !!item[disabledKey],
        label = String(item[labelKey] ?? item[valueKey] ?? "");
      if (Array.isArray(children)) {
        const raw = toRaw(item);
        if (seen.has(raw)) return;
        seen.add(raw);
        const title = group ? group + " / " + label : label;
        rows.push({ key: "group:" + path + index, group: title, index: -1 });
        visit(children, title, blocked, path + index + ".");
        return;
      }
      const value = item[valueKey];
      if (
        value === null ||
        value === undefined ||
        !["string", "number", "boolean", "object"].includes(typeof value)
      )
        return;
      const key = keyOf(value as HysSelectValue);
      if (keys.has(key)) return;
      keys.add(key);
      rows.push({
        key,
        option: {
          ...item,
          value: value as HysSelectValue,
          label,
          disabled: blocked,
        },
        group,
        index: optionIndex++,
      });
    });
  }
  visit(options);
  return rows;
}
