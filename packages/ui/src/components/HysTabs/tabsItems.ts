import { Fragment, isVNode, type VNodeChild } from "vue";
import HysTabPane from "../HysTabPane/HysTabPane.vue";
import type { HysTabItem, HysTabPaneSlots, HysTabValue } from "./tabsTypes";

export const tabToken = (key: HysTabValue) => typeof key + ":" + key;
export function tabIdToken(key: HysTabValue) {
  return Array.from(tabToken(key), (char) =>
    char.codePointAt(0)!.toString(36),
  ).join("-");
}
export const usable = (item: HysTabItem) => !item.hidden && !item.disabled;
export function orderedTabs(items: readonly HysTabItem[]) {
  const seen = new Set<HysTabValue>(),
    pinned: HysTabItem[] = [],
    rest: HysTabItem[] = [];
  for (const item of items) {
    if (
      (typeof item.value !== "string" && !Number.isFinite(item.value)) ||
      seen.has(item.value)
    )
      continue;
    seen.add(item.value);
    (item.pinned ? pinned : rest).push(item);
  }
  return [...pinned, ...rest];
}
export function neighbor(
  items: readonly HysTabItem[],
  previous: readonly HysTabItem[],
  key: HysTabValue,
) {
  const at = previous.findIndex((item) => item.value === key);
  const available = new Set(items.filter(usable).map((item) => item.value));
  return (
    (at < 0
      ? undefined
      : [...previous.slice(at + 1), ...previous.slice(0, at).reverse()].find(
          (item) => available.has(item.value),
        )) ?? items.find(usable)
  );
}
export function tabLength(value: string | number | undefined) {
  if (typeof value !== "number") return value;
  return Number.isFinite(value) ? Math.max(0, value) + "px" : undefined;
}
export const bounded = (
  value: number | undefined,
  fallback: number,
  max: number,
) =>
  Number.isFinite(value)
    ? Math.min(max, Math.max(0, Math.floor(value!)))
    : fallback;

export interface TabDeclaration {
  item: HysTabItem;
  slots: HysTabPaneSlots;
}
export function collectTabPanes(content: VNodeChild): TabDeclaration[] {
  const panes: TabDeclaration[] = [];
  function visit(node: unknown) {
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (!isVNode(node)) return;
    if (node.type === Fragment) {
      visit(node.children);
      return;
    }
    if (node.type !== HysTabPane) return;
    const item: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node.props ?? {})) {
      const camel = key.replace(/-([a-z])/g, (_, char: string) =>
        char.toUpperCase(),
      );
      item[camel] =
        value === "" &&
        [
          "disabled",
          "readonly",
          "hidden",
          "closable",
          "movable",
          "pinned",
          "favorite",
          "dirty",
          "unread",
          "dot",
          "lazy",
          "cache",
          "forceRender",
          "preload",
        ].includes(camel)
          ? true
          : value;
    }
    if (typeof item.label !== "string") item.label = String(item.value ?? "");
    panes.push({
      item: item as unknown as HysTabItem,
      slots:
        typeof node.children === "object" &&
        node.children &&
        !Array.isArray(node.children)
          ? (node.children as HysTabPaneSlots)
          : { default: () => node.children as VNodeChild },
    });
  }
  visit(content);
  return panes;
}
