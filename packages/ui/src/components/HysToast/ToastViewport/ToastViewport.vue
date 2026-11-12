<script lang="ts">
import {
  defineComponent,
  computed,
  h,
  reactive,
  Transition,
  TransitionGroup,
  vShow,
  watch,
  withDirectives,
  type CSSProperties,
  type PropType,
  type VNode,
} from "vue";
import {
  provideHysConfig,
  type HysMotion,
  type HysTheme,
} from "../../../config";
import type { createToastQueue } from "../../../composables/toastQueue";
import {
  presentation,
  toastStackKey,
  type ToastEntry,
  type ToastInstance,
} from "../../../composables/toastQueueModel";
import HysToast from "../HysToast.vue";
import {
  finite,
  normalizeToastPosition,
  toastLocale,
  toastPlacement,
} from "../toastPresentation";
import type {
  HysToastActionContext,
  HysToastConfig,
  HysToastRender,
} from "../toastTypes";
import { useToastStackDisclosure } from "./useToastStackDisclosure";

function atBottom(entry: ToastEntry) {
  const position = normalizeToastPosition(entry.options.position);
  return (
    position.startsWith("bottom") ||
    (position === "custom" &&
      entry.options.coordinates?.bottom !== undefined &&
      entry.options.coordinates.top === undefined)
  );
}
function stackPosition(entry: ToastEntry): CSSProperties {
  const position = normalizeToastPosition(entry.options.position);
  const placement = toastPlacement(entry.options);
  const shadowOffset = "calc(-1 * var(--hys-toast-stack-padding))";
  const centered = position === "center" || position.endsWith("center");
  return {
    ...placement,
    maxWidth: `calc(${placement.maxWidth} + var(--hys-toast-stack-padding) * 2)`,
    marginTop:
      placement.top !== undefined && position !== "center"
        ? shadowOffset
        : undefined,
    marginBottom: placement.bottom !== undefined ? shadowOffset : undefined,
    marginLeft:
      placement.left !== undefined && !centered ? shadowOffset : undefined,
    marginRight: placement.right !== undefined ? shadowOffset : undefined,
  };
}
function stackLayout(
  entry: ToastEntry,
  layout: HysToastConfig["layout"],
  gap: number,
): CSSProperties {
  const position = normalizeToastPosition(entry.options.position);
  return {
    flexDirection:
      layout === "horizontal"
        ? "row"
        : atBottom(entry)
          ? "column-reverse"
          : "column",
    flexWrap: layout === "horizontal" ? "wrap" : "nowrap",
    justifyContent:
      layout === "horizontal"
        ? position.endsWith("right")
          ? "flex-end"
          : position.endsWith("left")
            ? "flex-start"
            : "center"
        : undefined,
    alignItems: position.endsWith("left")
      ? "flex-start"
      : position.endsWith("right")
        ? "flex-end"
        : "center",
    gap: Math.max(0, gap) + "px",
  };
}
export default defineComponent({
  name: "HysToastViewport",
  props: {
    queue: {
      type: Object as PropType<ReturnType<typeof createToastQueue>>,
      required: true,
    },
    skin: {
      type: Function as PropType<() => Record<string, string>>,
      required: true,
    },
  },
  setup(props) {
    const expanded = reactive(new Set<string>());
    const disclosure = useToastStackDisclosure();
    const groups = computed(() => {
      const byPosition = new Map<string, ToastEntry[]>();
      for (const entry of props.queue.records.values()) {
        if (entry.status === "queued") continue;
        const key = toastStackKey(entry.options),
          group = byPosition.get(key);
        if (group) group.push(entry);
        else byPosition.set(key, [entry]);
      }
      return byPosition;
    });
    watch(
      [groups, () => props.queue.settings.value.layout],
      ([current, layout]) => {
        disclosure.retain(
          layout === "layered"
            ? [...current]
                .filter(([, entries]) => entries.length > 1)
                .map(([key]) => key)
            : [],
        );
        for (const key of expanded) if (!current.has(key)) expanded.delete(key);
      },
    );
    provideHysConfig({
      theme: () => props.skin()["data-hys-theme"] as HysTheme,
      motion: () => props.skin()["data-hys-motion"] as HysMotion,
    });
    const slot =
      (content: HysToastRender) => (context: HysToastActionContext) =>
        typeof content === "function" ? content(context) : content;
    function card(
      entry: ToastEntry,
      hidden: boolean,
      stack: string,
      previewDepth: number,
      paused: boolean,
    ): VNode {
      const { queue } = props,
        options = entry.options;
      const fromBottom = atBottom(entry);
      const preview = Array.from({ length: previewDepth }, (_, index) =>
        h("span", {
          key: "layer-" + index,
          class: "hys-ui-toast-layer-preview",
          "aria-hidden": "true",
          style: { "--hys-toast-layer-depth": index + 1, zIndex: -(index + 1) },
          onClick:
            props.queue.settings.value.layerTrigger === "hover"
              ? undefined
              : () => disclosure.toggle(stack),
        }),
      );
      const item = h(
        "div",
        {
          class: [
            "hys-ui-toast-stack-item",
            {
              "hys-ui-toast-layered-front": previewDepth,
              "hys-ui-toast-layered-bottom": previewDepth && fromBottom,
            },
          ],
          style: previewDepth
            ? { "--hys-toast-stack-depth": previewDepth }
            : undefined,
          ...(previewDepth && options.theme
            ? { "data-hys-ui": "", "data-hys-theme": options.theme }
            : {}),
          inert: hidden || undefined,
          "aria-hidden": hidden || undefined,
        },
        [
          ...preview,
          h(
            HysToast,
            {
              ...presentation(options),
              teleport: false,
              repeat: entry.repeat,
              paused:
                entry.paused || (paused && options.pauseOnHover !== false),
              interactive: !hidden && options.interactive !== false,
              ref: (instance: unknown) =>
                queue.setInstance(
                  entry,
                  instance as ToastInstance | null,
                  stack,
                ),
              "data-toast-id": entry.id,
              onUpdate: entry.handle.update,
              onShow: (context) => {
                if (entry.shown || entry.status !== "visible") return;
                entry.shown = true;
                queue.notify(entry.options.onShow, context);
              },
              onAfterShow: (context) => {
                if (entry.entered || entry.status !== "visible") return;
                entry.entered = true;
                queue.notify(entry.options.onAfterShow, context);
              },
              onClose: (context) => queue.begin(entry, context),
              onAfterClose: () => queue.finish(entry),
              onClick: (event, context) =>
                queue.notify(entry.options.onClick, event, context),
              onAction: (event) => queue.notify(entry.options.onAction, event),
            },
            {
              ...(options.content !== undefined
                ? { default: slot(options.content) }
                : {}),
              ...(options.icon !== undefined
                ? { icon: slot(options.icon) }
                : {}),
              ...(options.header !== undefined
                ? { header: slot(options.header) }
                : {}),
              ...(options.footer !== undefined
                ? { footer: slot(options.footer) }
                : {}),
              ...(options.renderActions !== undefined
                ? { action: slot(options.renderActions) }
                : {}),
            },
          ),
        ],
      );
      return h(
        Transition,
        { key: entry.serial, name: "hys-ui-toast-stack-expand" },
        {
          default: () => withDirectives(item, [[vShow, !hidden]]),
        },
      );
    }
    return () => {
      const { queue } = props,
        config = queue.settings.value;
      return [...groups.value].map(([key, group]) => {
        const layered = config.layout === "layered";
        const limit = layered
          ? 1
          : Math.max(0, Math.floor(finite(config.collapsedCount, 0)));
        const ordered = group.sort(queue.order);
        const count = limit ? Math.max(0, ordered.length - limit) : 0;
        const state = disclosure.stacks.get(key);
        const hover = layered && config.layerTrigger !== "click";
        const open = layered
          ? !!(state?.pinned || (hover && (state?.preview || state?.focused)))
          : expanded.has(key);
        const depth =
          layered && !open
            ? Math.min(
                count,
                Math.min(
                  4,
                  Math.max(1, Math.floor(finite(config.layerCount, 3)) - 1),
                ),
              )
            : 0;
        const locale = { ...toastLocale, ...config.locale };
        const children = ordered.map((entry, index) =>
          card(
            entry,
            !open && !!count && index >= limit,
            key,
            index === 0 ? depth : 0,
            !!(hover && state?.preview),
          ),
        );
        if (count)
          children.push(
            h(
              "button",
              {
                key: "stack-toggle",
                type: "button",
                class: "hys-ui-toast-stack-toggle",
                "aria-expanded": open,
                onClick: () => {
                  if (layered) disclosure.toggle(key);
                  else if (open) expanded.delete(key);
                  else expanded.add(key);
                },
              },
              (layered ? state?.pinned : open)
                ? locale.collapseStack
                : layered && open
                  ? locale.pinStack
                  : locale.more(count),
            ),
          );
        const items = h(
          TransitionGroup,
          {
            tag: "div",
            moveClass: "hys-ui-toast-stack-move",
            class: [
              "hys-ui-toast-stack-items",
              { "hys-ui-toast-stack-hover": hover && count },
            ],
            ...(hover && count
              ? {
                  onPointerenter: (event: PointerEvent) =>
                    disclosure.enter(key, event),
                  onPointerleave: () => disclosure.leave(key),
                  onFocusin: () => disclosure.focusIn(key),
                  onFocusout: (event: FocusEvent) =>
                    disclosure.focusOut(key, event),
                }
              : {}),
            style: stackLayout(
              ordered[0],
              config.layout ?? "vertical",
              finite(config.gap, 10),
            ),
          },
          { default: () => children },
        );
        return h(
          "div",
          {
            key,
            ...props.skin(),
            class: "hys-ui-toast-stack",
            style: stackPosition(ordered[0]),
          },
          [items],
        );
      });
    };
  },
});
</script>

<style scoped>
.hys-ui-toast-stack {
  --hys-toast-stack-padding: 56px;
  width: max-content;
  box-sizing: border-box;
  max-block-size: calc(100dvh - 32px + var(--hys-toast-stack-padding) * 2);
  overflow: auto;
  scrollbar-width: none;
  padding: var(--hys-toast-stack-padding);
  pointer-events: none;
}
.hys-ui-toast-stack-items {
  display: flex;
  min-width: 0;
}
.hys-ui-toast-stack-hover {
  pointer-events: auto;
}
.hys-ui-toast-stack-item {
  display: flex;
  max-width: 100%;
  min-width: 0;
}
.hys-ui-toast-layered-front {
  --hys-toast-layer-step: 7px;
  position: relative;
  isolation: isolate;
  margin-block-end: calc(
    var(--hys-toast-stack-depth) * var(--hys-toast-layer-step)
  );
}
.hys-ui-toast-layered-bottom {
  --hys-toast-layer-step: -7px;
  margin-block: calc(
      -1 * var(--hys-toast-stack-depth) * var(--hys-toast-layer-step)
    )
    0;
}
.hys-ui-toast-layer-preview {
  position: absolute;
  inset: 0 calc(var(--hys-toast-layer-depth) * 6px);
  transform: translateY(
    calc(var(--hys-toast-layer-depth) * var(--hys-toast-layer-step))
  );
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 9px;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
  box-shadow: 0 4px 12px #0001;
  cursor: pointer;
  pointer-events: auto;
}
.hys-ui-toast-stack-toggle {
  border: 1px solid var(--hys-ui-border, var(--hys-ui-theme-border));
  border-radius: 7px;
  padding: 5px 10px;
  font: inherit;
  font-size: 12px;
  color: var(--hys-ui-text, var(--hys-ui-theme-text));
  background: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  pointer-events: auto;
  cursor: pointer;
}
.hys-ui-toast-stack-move {
  transition: transform var(--hys-ui-motion-fast, 180ms) ease;
}
.hys-ui-toast-stack-expand-enter-active,
.hys-ui-toast-stack-expand-leave-active {
  transition:
    opacity var(--hys-ui-motion-fast, 180ms) ease,
    transform var(--hys-ui-motion-fast, 180ms) ease;
}
.hys-ui-toast-stack-expand-enter-from,
.hys-ui-toast-stack-expand-leave-to {
  opacity: 0;
  transform: scale(0.97);
}
.hys-ui-toast-stack[data-hys-motion="off"] .hys-ui-toast-stack-item {
  transition: none;
}
@media (prefers-reduced-motion: reduce) {
  .hys-ui-toast-stack-item {
    transition: none;
  }
}
</style>
