import {
  cloneVNode,
  Comment,
  defineComponent,
  Fragment,
  h,
  isVNode,
  Text,
  type VNode,
} from "vue";
const flatten = (nodes: VNode[]): VNode[] =>
  nodes.flatMap((node) =>
    node.type === Fragment
      ? flatten(node.children as VNode[])
      : node.type === Comment ||
          (node.type === Text && !String(node.children).trim())
        ? []
        : [node],
  );
/** Adds popup ARIA to the real control without introducing another keyboard stop. */
export default defineComponent({
  name: "HysPopupReference",
  inheritAttrs: false,
  props: { id: String, open: Boolean, kind: String },
  emits: ["element"],
  setup(props, { slots, emit }) {
    const element = (value: any) => {
      const el = value?.$el ?? value;
      emit("element", el instanceof HTMLElement ? el : undefined);
    };
    return () => {
      const children = slots.default?.() ?? [],
        nodes = flatten(children);
      const node = nodes[0];
      if (
        nodes.length !== 1 ||
        !isVNode(node) ||
        node.type === Text ||
        node.type === Comment
      ) {
        return h(Fragment, null, children);
      }
      const described = node.props?.["aria-describedby"];
      return cloneVNode(
        node,
        {
          ref: element,
          ...(props.kind === "tooltip"
            ? {
                "aria-describedby": props.open
                  ? [described, props.id].filter(Boolean).join(" ")
                  : described,
              }
            : {
                "aria-controls": props.open
                  ? props.id
                  : node.props?.["aria-controls"],
                "aria-expanded": props.open,
                "aria-haspopup": node.props?.["aria-haspopup"] ?? "dialog",
              }),
        },
        true,
      );
    };
  },
});
