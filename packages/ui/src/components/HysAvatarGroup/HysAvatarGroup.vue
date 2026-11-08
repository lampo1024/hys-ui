<script lang="ts">
import {
  Comment,
  Fragment,
  Text,
  Teleport,
  cloneVNode,
  computed,
  defineComponent,
  h,
  mergeProps,
  nextTick,
  onBeforeUnmount,
  onDeactivated,
  onUpdated,
  provide,
  ref,
  useId,
  watch,
  type CSSProperties,
  type PropType,
  type SlotsType,
  type VNode,
} from "vue";
import HysAvatar from "../HysAvatar/HysAvatar.vue";
import { useHysRootAttrs } from "../../config";
import {
  avatarGroupKey,
  type HysAvatarOption,
  type HysAvatarSize,
} from "../../composables/avatar";
import { useFloating, type Placement } from "../../composables/useFloating";
interface Entry {
  key: string | number;
  node: VNode;
  option?: HysAvatarOption;
}
function flatten(nodes: VNode[]): VNode[] {
  return nodes.flatMap((node) =>
    node.type === Fragment
      ? flatten((node.children || []) as VNode[])
      : node.type === Comment ||
          (node.type === Text && !String(node.children).trim())
        ? []
        : [node],
  );
}
export default defineComponent({
  name: "HysAvatarGroup",
  inheritAttrs: false,
  props: {
    options: Array as PropType<readonly HysAvatarOption[]>,
    size: [Number, String, Object] as PropType<HysAvatarSize>,
    shape: String as PropType<"circle" | "square">,
    gap: { type: Number, default: -10 },
    maxCount: Number,
    vertical: Boolean,
    bordered: { type: Boolean, default: true },
    maxStyle: Object as PropType<CSSProperties>,
    maxClass: String,
    placement: { type: String as PropType<Placement>, default: "top-start" },
    trigger: {
      type: String as PropType<"hover" | "focus" | "click">,
      default: "hover",
    },
    showOverflow: { type: Boolean, default: true },
    expandOnHover: Boolean,
  },
  emits: {
    visibleChange: (_open: boolean) => true,
    overflowClick: (_count: number, _event: MouseEvent) => true,
  },
  slots: Object as SlotsType<{
    default?: () => VNode[];
    avatar?: (props: { option: HysAvatarOption; index: number }) => VNode[];
    overflow?: (props: {
      count: number;
      options: HysAvatarOption[];
    }) => VNode[];
    content?: (props: {
      options: HysAvatarOption[];
      close: () => void;
    }) => VNode[];
    empty?: () => VNode[];
  }>,
  setup(props, { attrs, slots, emit, expose }) {
    const root = ref<HTMLElement>(),
      button = ref<HTMLElement>(),
      panel = ref<HTMLElement>(),
      hovered = ref(false),
      hysRootAttrs = useHysRootAttrs(),
      id = "hys-avatar-group-" + useId();
    provide(avatarGroupKey, {
      size: computed(() => props.size),
      shape: computed(() => props.shape),
      bordered: computed(() => props.bordered),
    });
    const floating = useFloating(button, panel, {
      get placement() {
        return props.placement;
      },
    });
    let timer: ReturnType<typeof setTimeout> | undefined;
    function clear() {
      clearTimeout(timer);
      timer = undefined;
    }
    function enter() {
      clear();
      if (props.trigger === "hover" && !floating.restoringFocus.value)
        void floating.show();
    }
    function leave() {
      clear();
      if (props.trigger === "hover")
        timer = setTimeout(() => floating.close(), 80);
    }
    function focus() {
      clear();
      if (props.trigger !== "click" && !floating.restoringFocus.value)
        void floating.show();
    }
    function blur(event: FocusEvent) {
      if (
        event.relatedTarget instanceof Node &&
        (root.value?.contains(event.relatedTarget) ||
          panel.value?.contains(event.relatedTarget))
      )
        return;
      clear();
      floating.close();
    }
    function cleanup() {
      clear();
      floating.close(false, true);
      hovered.value = false;
    }
    function entries(): Entry[] {
      return props.options
        ? props.options.map((option, index) => ({
            key: option.key ?? index,
            option,
            node: slots.avatar
              ? h(Fragment, null, slots.avatar({ option, index }))
              : h(HysAvatar, option),
          }))
        : flatten(slots.default?.() ?? []).map((node, index) => ({
            key:
              typeof node.key === "string" || typeof node.key === "number"
                ? node.key
                : index,
            node,
          }));
    }
    function spacing(index: number): CSSProperties {
      const base = Number.isFinite(props.gap) ? props.gap : -10;
      const gap =
        props.expandOnHover && hovered.value ? Math.max(0, base) : base;
      return {
        ...(props.vertical
          ? { marginTop: index ? gap + "px" : undefined }
          : { marginInlineStart: index ? gap + "px" : undefined }),
        zIndex: index + 1,
      };
    }
    const name = (entry: Entry) =>
      entry.option?.name ||
      entry.option?.alt ||
      entry.node.props?.name ||
      entry.node.props?.alt ||
      "成员";
    function copy(entry: Entry, key: string | number, popup = false) {
      const vnode = cloneVNode(entry.node);
      if (popup) vnode.ref = null;
      vnode.key = key;
      return vnode;
    }
    const overflowKey = Symbol("hys-avatar-overflow");
    async function open() {
      clear();
      if (button.value?.isConnected) await floating.show();
    }
    function close() {
      clear();
      floating.close();
    }
    expose({ open, close });
    watch(floating.open, (value) => emit("visibleChange", value));
    watch(() => [props.maxCount, props.showOverflow, props.trigger], cleanup);
    watch(
      () => props.placement,
      () => {
        if (floating.open.value) floating.update();
      },
    );
    onUpdated(() => {
      if (floating.open.value && !button.value?.isConnected) cleanup();
    });
    watch(
      () => [props.options, props.size, props.shape],
      () =>
        void nextTick(() => {
          if (floating.open.value) floating.update();
        }),
      { deep: true },
    );
    onDeactivated(cleanup);
    onBeforeUnmount(cleanup);
    return {
      open,
      close,
      renderGroup: () => {
        const all = entries(),
          limit =
            props.maxCount === undefined || !Number.isFinite(props.maxCount)
              ? all.length
              : Math.max(0, Math.floor(props.maxCount)),
          visible = all.slice(0, limit),
          hidden = all.slice(limit),
          hiddenOptions = hidden.flatMap((entry) =>
            entry.option ? [entry.option] : [],
          );
        const items = visible.map((entry, index) =>
          h(
            "span",
            {
              class: "hys-ui-avatar-group-item",
              style: spacing(index),
              key: entry.key,
            },
            [copy(entry, entry.key)],
          ),
        );
        if (hidden.length && props.showOverflow)
          items.push(
            h(
              "span",
              {
                class: "hys-ui-avatar-group-item",
                style: spacing(visible.length),
                key: overflowKey,
              },
              [
                h(
                  "button",
                  {
                    ref: button,
                    type: "button",
                    class: "hys-ui-avatar-group-more",
                    "aria-label": `查看其余 ${hidden.length} 位成员`,
                    "aria-expanded": floating.open.value,
                    "aria-controls": floating.open.value ? id : undefined,
                    onPointerenter: enter,
                    onPointerleave: leave,
                    onFocus: focus,
                    onBlur: blur,
                    onClick: (event: MouseEvent) => {
                      clear();
                      emit("overflowClick", hidden.length, event);
                      if (props.trigger === "click") void floating.toggle();
                      else void open();
                    },
                    onKeydown: async (event: KeyboardEvent) => {
                      if (event.key === "ArrowDown") {
                        event.preventDefault();
                        await open();
                        await nextTick();
                        panel.value?.focus();
                      }
                    },
                  },
                  [
                    h(
                      HysAvatar,
                      {
                        class: props.maxClass,
                        style: props.maxStyle,
                        "aria-hidden": "true",
                      },
                      () =>
                        slots.overflow?.({
                          count: hidden.length,
                          options: hiddenOptions,
                        }) ?? "+" + hidden.length,
                    ),
                  ],
                ),
              ],
            ),
          );
        const popup =
          floating.open.value && hidden.length && props.showOverflow
            ? h(Teleport, { to: "body" }, [
                h(
                  "div",
                  {
                    ...hysRootAttrs.value,
                    id,
                    ref: panel,
                    role: "group",
                    "aria-label": "其余成员",
                    tabindex: -1,
                    class: "hys-ui-avatar-group-popover",
                    style: floating.style.value,
                    onPointerenter: clear,
                    onPointerleave: leave,
                    onFocusin: clear,
                    onFocusout: blur,
                  },
                  slots.content?.({
                    options: hiddenOptions,
                    close,
                  }) ??
                    hidden.map((entry, index) =>
                      h(
                        "div",
                        { class: "hys-ui-avatar-group-person", key: entry.key },
                        [
                          copy(entry, "popup-" + index, true),
                          h(
                            "span",
                            { class: "hys-ui-avatar-group-name" },
                            String(name(entry)),
                          ),
                        ],
                      ),
                    ),
                ),
              ])
            : null;
        return h(
          "div",
          mergeProps(hysRootAttrs.value, attrs, {
            ref: root,
            role: "group",
            "aria-label": attrs["aria-label"] ?? "头像组",
            class: [
              "hys-ui-avatar-group",
              { "hys-ui-avatar-group-vertical": props.vertical },
            ],
            style: attrs.style as CSSProperties,
            onPointerenter: () => (hovered.value = true),
            onPointerleave: () => (hovered.value = false),
            onFocusin: () => (hovered.value = true),
            onFocusout: (event: FocusEvent) => {
              if (!(
                event.relatedTarget instanceof Node &&
                root.value?.contains(event.relatedTarget)
              ))
                hovered.value = false;
            },
          }),
          [...items, ...(!all.length ? (slots.empty?.() ?? []) : []), popup],
        );
      },
    };
  },
  render(): VNode {
    return this.renderGroup();
  },
});
</script>
<style scoped>
.hys-ui-avatar-group {
  display: inline-flex;
  align-items: center;
  vertical-align: middle;
  isolation: isolate;
}
.hys-ui-avatar-group-vertical {
  flex-direction: column;
}
.hys-ui-avatar-group-item {
  position: relative;
  display: inline-flex;
  flex: none;
  transition: margin 0.16s ease;
}
.hys-ui-avatar-group-item:hover,
.hys-ui-avatar-group-item:focus-within {
  z-index: 100 !important;
}
.hys-ui-avatar-group-more {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  cursor: pointer;
  font: inherit;
  line-height: 1;
}
.hys-ui-avatar-group-more:focus-visible {
  outline: 2px solid var(--hys-ui-primary, var(--hys-ui-theme-primary));
  outline-offset: 4px;
}
.hys-ui-avatar-group-popover {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 10px;
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  box-shadow: 0 10px 32px #17274420;
  min-width: 160px;
  width: max-content;
}
.hys-ui-avatar-group-person {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 0;
}
.hys-ui-avatar-group-name {
  font-size: 13px;
  overflow-wrap: anywhere;
  max-width: 220px;
}
[data-hys-motion="off"] .hys-ui-avatar-group-item {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-avatar-group-item {
    transition: none;
  }
}
</style>
