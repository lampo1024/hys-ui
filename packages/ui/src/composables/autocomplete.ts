import type { HysPopupTransition } from '../motion/popup';
import type { Component, CSSProperties } from "vue";
import type { Placement } from "./useFloating";
import type { HysInputProps } from "./textInput";
export interface HysAutocompleteOption {
  value?: string;
  label?: string;
  disabled?: boolean;
  [key: string]: unknown;
}
export type HysAutocompleteItem = string | HysAutocompleteOption;
export interface HysAutocompleteGroup {
  label: string;
  options?: readonly HysAutocompleteDataOption[];
  children?: readonly HysAutocompleteDataOption[];
  disabled?: boolean;
  key?: string | number;
  type?: "group";
}
export type HysAutocompleteDataOption =
  HysAutocompleteItem | HysAutocompleteGroup;
export interface HysAutocompleteContext {
  signal: AbortSignal;
}
export type HysAutocompleteCallback = (
  options: readonly HysAutocompleteDataOption[],
) => void;
export type HysAutocompleteFetch = (
  query: string,
  callback: HysAutocompleteCallback,
  context: HysAutocompleteContext,
) =>
  | void
  | readonly HysAutocompleteDataOption[]
  | Promise<void | readonly HysAutocompleteDataOption[]>;
export interface HysAutocompleteProps {
  popupTransition?: HysPopupTransition;
  popupTransitionDuration?: number;
  modelValue?: string;
  defaultValue?: string;
  options?: readonly HysAutocompleteDataOption[];
  fetchSuggestions?:
    HysAutocompleteFetch | readonly HysAutocompleteDataOption[];
  valueKey?: string;
  labelKey?: string;
  filterOption?:
    boolean | ((query: string, item: HysAutocompleteItem) => boolean);
  caseSensitive?: boolean;
  debounce?: number;
  minQueryLength?: number;
  triggerOnFocus?: boolean;
  highlightFirst?: boolean;
  loopNavigation?: boolean;
  backfill?: boolean;
  selectWhenUnmatched?: boolean;
  selectOnTab?: boolean;
  append?: boolean;
  clearAfterSelect?: boolean;
  blurAfterSelect?: boolean;
  getShow?: (query: string) => boolean;
  disabled?: boolean;
  readonly?: boolean;
  loading?: boolean;
  hideLoading?: boolean;
  clearable?: boolean;
  clearIcon?: Component;
  placeholder?: string;
  label?: string;
  ariaLabel?: string;
  name?: string;
  status?: "error" | "warning" | "success";
  error?: string;
  size?: "sm" | "md" | "lg";
  bordered?: boolean;
  autofocus?: boolean;
  inputProps?: Omit<HysInputProps, "modelValue" | "defaultValue">;
  open?: boolean;
  defaultOpen?: boolean;
  placement?: Placement;
  popupMatchWidth?: boolean;
  popupWidth?: number | string;
  popupClass?: string;
  popupStyle?: CSSProperties;
  appendTo?: string | HTMLElement | false;
  listHeight?: number;
  emptyText?: string;
  loadingText?: string;
  errorText?: string;
}
export interface HysAutocompleteInstance {
  input: HTMLInputElement | HTMLTextAreaElement | undefined;
  isOpen: boolean;
  loading: boolean;
  highlightedIndex: number;
  suggestions: readonly HysAutocompleteDataOption[];
  focus: (options?: FocusOptions) => void;
  blur: () => void;
  open: () => Promise<void>;
  close: () => void;
  clear: () => void;
  getData: () => Promise<void>;
  retry: () => Promise<void>;
  highlight: (index: number) => void;
  select: (option: HysAutocompleteItem) => Promise<void>;
}
export interface HysAutocompleteRow {
  key: string;
  kind: "group" | "option";
  label: string;
  value: string;
  disabled: boolean;
  item: HysAutocompleteItem;
  group?: HysAutocompleteGroup;
}
export function autocompleteValue(
  item: HysAutocompleteItem,
  key = "value",
  labelKey = "label",
) {
  return typeof item === "string"
    ? item
    : String(item[key] ?? item.value ?? item[labelKey] ?? item.label ?? "");
}
export function normalizeAutocomplete(
  data: readonly HysAutocompleteDataOption[],
  query: string,
  settings: {
    valueKey: string;
    labelKey: string;
    filter: boolean | ((query: string, item: HysAutocompleteItem) => boolean);
    caseSensitive: boolean;
  },
): HysAutocompleteRow[] {
  const fold = (value: string) =>
      settings.caseSensitive ? value : value.toLocaleLowerCase(),
    needle = fold(query);
  function walk(
    items: readonly HysAutocompleteDataOption[],
    prefix = "",
    inherited = false,
  ): HysAutocompleteRow[] {
    return items.flatMap((item, index) => {
      if (
        typeof item !== "string" &&
        (!item || typeof item !== "object" || Array.isArray(item))
      )
        return [];
      const key = prefix + index,
        object = typeof item === "string" ? undefined : item,
        children =
          object &&
          (Array.isArray(object.options)
            ? object.options
            : Array.isArray(object.children)
              ? object.children
              : undefined);
      if (children) {
        const group = object as unknown as HysAutocompleteGroup,
          nested = walk(children, key + "-", inherited || !!group.disabled);
        return nested.length
          ? [
              {
                key,
                kind: "group",
                label: String(group.label ?? ""),
                value: "",
                disabled: true,
                item: "",
                group,
              } as HysAutocompleteRow,
              ...nested,
            ]
          : [];
      }
      const raw = item as HysAutocompleteItem,
        value = autocompleteValue(raw, settings.valueKey, settings.labelKey),
        label =
          typeof raw === "string"
            ? raw
            : String(raw[settings.labelKey] ?? raw.label ?? value);
      let include = true;
      try {
        include =
          typeof settings.filter === "function"
            ? settings.filter(query, raw)
            : !settings.filter ||
              !query ||
              fold(label).includes(needle) ||
              fold(value).includes(needle);
      } catch {
        include = false;
      }
      return include
        ? [
            {
              key,
              kind: "option",
              label,
              value,
              disabled: inherited || !!(object && object.disabled),
              item: raw,
            } as HysAutocompleteRow,
          ]
        : [];
    });
  }
  return walk(data);
}
