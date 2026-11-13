import { Comment, Fragment, Text, isVNode, type VNode } from "vue";
import type { HysSpaceGap } from "./spaceTypes";

interface SpaceItem {
  key: string;
  node: VNode;
}
export function collectSpaceItems(
  nodes: readonly unknown[],
  path = "",
  items: SpaceItem[] = [],
) {
  nodes.forEach((node, index) => {
    if (
      !isVNode(node) ||
      node.type === Comment ||
      (node.type === Text && !String(node.children ?? "").trim())
    )
      return;
    const key =
      path +
      "/" +
      (node.key === null
        ? "#" + index
        : JSON.stringify([typeof node.key, String(node.key)]));
    if (node.type === Fragment && Array.isArray(node.children))
      collectSpaceItems(node.children, key, items);
    else items.push({ key, node });
  });
  return items;
}
const sizes = { sm: "8px", md: "12px", lg: "20px" };
export function spaceGap(value: HysSpaceGap) {
  if (typeof value === "number")
    return Number.isFinite(value) ? Math.max(0, value) + "px" : sizes.sm;
  return Object.hasOwn(sizes, value)
    ? sizes[value as keyof typeof sizes]
    : value;
}
