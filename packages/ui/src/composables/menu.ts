import type { HysPopupMotionProps } from "../motion/popup";
import {
  toRaw,
  type Component,
  type CSSProperties,
  type VNodeChild,
} from "vue";
import type { Placement } from "./useFloating";
export type HysMenuKey = string | number;
export type HysContextMenuTrigger = "contextmenu" | "click" | "hover" | "focus";
export interface HysContextMenuItem {
  label: string;
  value?: HysMenuKey;
  type?: "item" | "divider" | "group" | "checkbox" | "radio";
  children?: readonly HysContextMenuItem[];
  disabled?: boolean;
  hidden?: boolean;
  danger?: boolean;
  icon?: Component;
  description?: string;
  shortcut?: string;
  href?: string;
  target?: string;
  rel?: string;
  checked?: boolean;
  radioGroup?: HysMenuKey;
  closeOnSelect?: boolean;
}
export interface HysMenuFieldNames {
  value: string;
  label: string;
  children: string;
  disabled: string;
  hidden: string;
  type: string;
  icon: string;
  description: string;
  shortcut: string;
  href: string;
  target: string;
  rel: string;
  danger: string;
  checked: string;
  radioGroup: string;
  closeOnSelect: string;
}
export interface HysMenuSelectInfo<N extends object = HysContextMenuItem> {
  item: N;
  path: readonly N[];
  keys: readonly HysMenuKey[];
  event: MouseEvent | KeyboardEvent | undefined;
  checked?: boolean;
  checkedKeys: readonly HysMenuKey[];
  selectedKeys: readonly HysMenuKey[];
}
export interface HysMenuShowOptions {
  x?: number;
  y?: number;
  focus?: boolean;
}
export interface HysContextMenuProps<
  N extends object = HysContextMenuItem,
> extends HysPopupMotionProps {
  items: readonly N[];
  fieldNames?: Partial<HysMenuFieldNames>;
  disabled?: boolean;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  trigger?: HysContextMenuTrigger | readonly HysContextMenuTrigger[];
  open?: boolean;
  defaultOpen?: boolean;
  openPath?: readonly HysMenuKey[];
  defaultOpenPath?: readonly HysMenuKey[];
  checkedKeys?: readonly HysMenuKey[];
  defaultCheckedKeys?: readonly HysMenuKey[];
  selectedKeys?: readonly HysMenuKey[];
  defaultSelectedKeys?: readonly HysMenuKey[];
  selectable?: boolean;
  multiple?: boolean;
  hideOnClick?: boolean;
  autofocus?: boolean;
  loopNavigation?: boolean;
  showDelay?: number;
  hideDelay?: number;
  submenuDelay?: number;
  submenuTrigger?: "hover" | "click";
  placement?: Placement;
  appendTo?: string | HTMLElement | false;
  width?: string | number;
  minWidth?: number;
  maxWidth?: number;
  maxHeight?: number;
  arrow?: boolean;
  popupClass?: string;
  popupStyle?: CSSProperties;
  direction?: "ltr" | "rtl";
  ariaLabel?: string;
  emptyText?: string;
  loadingText?: string;
  backText?: string;
}
export interface HysContextMenuInstance<N extends object = HysContextMenuItem> {
  readonly element: HTMLElement | undefined;
  readonly open: boolean;
  readonly checkedKeys: HysMenuKey[];
  readonly selectedKeys: HysMenuKey[];
  readonly openPath: HysMenuKey[];
  focus: () => void;
  blur: () => void;
  show: (
    event?: MouseEvent | KeyboardEvent | HysMenuShowOptions,
  ) => Promise<boolean>;
  showAt: (x: number, y: number, focus?: boolean) => Promise<boolean>;
  hide: (restoreFocus?: boolean) => Promise<boolean>;
  handleOpen: () => Promise<boolean>;
  handleClose: () => Promise<boolean>;
  toggle: () => Promise<boolean>;
  focusItem: (key: HysMenuKey) => Promise<boolean>;
  openSubmenu: (key: HysMenuKey) => Promise<boolean>;
  closeSubmenus: () => Promise<boolean>;
  setCheckedKeys: (keys: readonly HysMenuKey[]) => Promise<boolean>;
  setSelectedKeys: (keys: readonly HysMenuKey[]) => Promise<boolean>;
  getItems: () => N[];
}
export interface HysMenuItemContext<N extends object = HysContextMenuItem> {
  item: N;
  value: HysMenuKey | undefined;
  label: string;
  path: readonly N[];
  keys: readonly HysMenuKey[];
  level: number;
  disabled: boolean;
  checked: boolean;
  selected: boolean;
  expanded: boolean;
  submenu: boolean;
}
export interface HysContextMenuSlots<N extends object = HysContextMenuItem> {
  default?: (scope: {
    open: boolean;
    show: HysContextMenuInstance<N>["show"];
    hide: HysContextMenuInstance<N>["hide"];
    toggle: HysContextMenuInstance<N>["toggle"];
    attrs: Record<string, unknown>;
  }) => VNodeChild;
  item?: (scope: HysMenuItemContext<N>) => VNodeChild;
  icon?: (scope: HysMenuItemContext<N>) => VNodeChild;
  link?: (
    scope: HysMenuItemContext<N> & { attrs: Record<string, unknown> },
  ) => VNodeChild;
  header?: (scope: { close: () => Promise<boolean> }) => VNodeChild;
  footer?: (scope: { close: () => Promise<boolean> }) => VNodeChild;
  empty?: () => VNodeChild;
  loading?: () => VNodeChild;
}
export interface MenuRow<N extends object> {
  id: string;
  raw: N;
  key?: HysMenuKey;
  label: string;
  type: NonNullable<HysContextMenuItem["type"]>;
  disabled: boolean;
  danger: boolean;
  icon?: Component;
  description: string;
  shortcut: string;
  href?: string;
  target?: string;
  rel?: string;
  radioGroup?: HysMenuKey;
  checked: boolean;
  closeOnSelect?: boolean;
  children: MenuRow<N>[];
  parents: MenuRow<N>[];
  path: N[];
  keys: HysMenuKey[];
  level: number;
}
export const menuToken = (key: HysMenuKey) => typeof key + ":" + key;
export function menuKeys(keys: readonly HysMenuKey[] | undefined) {
  return [
    ...new Set(
      (keys ?? []).filter(
        (key) =>
          typeof key === "string" ||
          (typeof key === "number" && Number.isFinite(key)),
      ),
    ),
  ];
}
export const menuKeysEqual = (
  a: readonly HysMenuKey[],
  b: readonly HysMenuKey[],
) => a.length === b.length && a.every((key, i) => key === b[i]);
export function menuField(item: object, path: string): unknown {
  let value: unknown = item;
  for (const part of path.split(".")) {
    if (
      !value ||
      typeof value !== "object" ||
      !Object.prototype.hasOwnProperty.call(value, part)
    )
      return;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}
export const menuSafeRel = (target?: string, rel?: string) =>
  target === "_blank"
    ? [
        ...new Set(
          (rel ?? "")
            .split(/\s+/)
            .filter(Boolean)
            .concat("noopener", "noreferrer"),
        ),
      ].join(" ")
    : rel;
export function menuRows<N extends object>(
  items: readonly N[],
  fields: Partial<HysMenuFieldNames> = {},
) {
  const all: MenuRow<N>[] = [],
    seen = new Set<string>(),
    objects = new WeakSet<object>();
  let structural = 0;
  function walk(
    list: readonly N[],
    parents: MenuRow<N>[],
    inherited = false,
    depth = 0,
  ): MenuRow<N>[] {
    if (depth > 32) return [];
    const result: MenuRow<N>[] = [];
    for (const raw of list) {
      if (!raw || typeof raw !== "object" || objects.has(raw)) continue;
      objects.add(raw);
      const read = (name: keyof HysMenuFieldNames) =>
        menuField(raw, fields[name] ?? name);
      if (read("hidden")) continue;
      const value = read("value"),
        key =
          typeof value === "string" ||
          (typeof value === "number" && Number.isFinite(value))
            ? value
            : undefined;
      const typeValue = read("type"),
        type = ["divider", "group", "checkbox", "radio"].includes(
          String(typeValue),
        )
          ? (typeValue as MenuRow<N>["type"])
          : "item";
      if (
        type !== "divider" &&
        type !== "group" &&
        (key === undefined || seen.has(menuToken(key)))
      )
        continue;
      if (type !== "divider" && type !== "group") seen.add(menuToken(key!));
      const asText = (name: keyof HysMenuFieldNames) =>
        String(read(name) ?? "");
      const icon = read("icon"),
        children = read("children");
      const row: MenuRow<N> = {
        id:
          key === undefined || type === "group" || type === "divider"
            ? "structure-" + ++structural
            : encodeURIComponent(menuToken(key)),
        raw,
        key,
        label: asText("label"),
        type,
        disabled: inherited || !!read("disabled"),
        danger: !!read("danger"),
        icon:
          icon && (typeof icon === "object" || typeof icon === "function")
            ? toRaw(icon as Component)
            : undefined,
        description: asText("description"),
        shortcut: asText("shortcut"),
        href: read("href") == null ? undefined : asText("href"),
        target: read("target") == null ? undefined : asText("target"),
        rel: read("rel") == null ? undefined : asText("rel"),
        radioGroup: read("radioGroup") as HysMenuKey | undefined,
        checked: !!read("checked"),
        closeOnSelect:
          typeof read("closeOnSelect") === "boolean"
            ? (read("closeOnSelect") as boolean)
            : undefined,
        children: [],
        parents,
        path: parents.map((p) => p.raw).concat(raw),
        keys: parents
          .flatMap((p) => (p.key === undefined ? [] : [p.key]))
          .concat(key === undefined ? [] : [key]),
        level: parents.length,
      };
      result.push(row);
      all.push(row);
      if (Array.isArray(children) && type !== "divider") {
        const normalized = walk(
          children as N[],
          type === "group" ? parents : parents.concat(row),
          row.disabled,
          depth + 1,
        );
        if (type === "group") result.push(...normalized);
        else row.children = normalized;
      }
    }
    return result;
  }
  const roots = walk(items, []);
  return {
    roots,
    all,
    byKey: new Map(
      all
        .filter(
          (row) =>
            row.key !== undefined &&
            row.type !== "divider" &&
            row.type !== "group",
        )
        .map((row) => [menuToken(row.key!), row]),
    ),
  };
}
