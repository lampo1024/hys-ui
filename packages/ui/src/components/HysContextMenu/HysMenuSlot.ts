import {
  cloneVNode,
  Comment,
  Fragment,
  h,
  isVNode,
  Text,
  type FunctionalComponent,
  type VNode,
  type VNodeChild,
} from "vue";
/** Keep a single interactive root so router/link slots receive menu semantics. */
const HysMenuSlot: FunctionalComponent<{
  content?: (scope: any) => VNodeChild;
  scope: any;
  nodeAttrs?: Record<string, unknown>;
}> = (props) => {
  const flatten = (value: VNodeChild): VNode[] =>
    (Array.isArray(value) ? value : [value]).flatMap((node) => {
      if (!isVNode(node))
        return node == null || typeof node === "boolean"
          ? []
          : [h("span", String(node))];
      if (
        node.type === Comment ||
        (node.type === Text && !String(node.children ?? "").trim())
      )
        return [];
      return node.type === Fragment && Array.isArray(node.children)
        ? flatten(node.children as VNodeChild)
        : [node];
    });
  const nodes = flatten(props.content?.(props.scope));
  return nodes.length === 1
    ? cloneVNode(nodes[0], props.nodeAttrs, true)
    : h("span", props.nodeAttrs, nodes);
};
HysMenuSlot.props = ["content", "scope", "nodeAttrs"];
export default HysMenuSlot;
