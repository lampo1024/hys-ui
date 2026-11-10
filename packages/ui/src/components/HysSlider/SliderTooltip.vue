<script setup lang="ts">
import PopupMotion from '../../motion/PopupMotion';
import {popupSize,type HysPopupMotionProps} from '../../motion/popup';
import {
  nextTick,
  onActivated,
  onBeforeUnmount,
  onDeactivated,
  ref,
  watch,
  type CSSProperties,
} from "vue";
import { useHysRootAttrs } from "../../config";
const props = defineProps<HysPopupMotionProps & {
  visible: boolean;
  id: string;
  anchor?: HTMLElement;
  container?: HTMLElement;
  placement: "top" | "bottom" | "left" | "right";
  position: number;
}>();
const hysRootAttrs = useHysRootAttrs(),
  panel = ref<HTMLElement>(),
  active = ref(true);
const style = ref<CSSProperties>({ position: "fixed", visibility: "hidden" });
const resolvedPlacement = ref(props.placement);
let frame: number | undefined, detach: (() => void) | undefined;
let clipping: { element: HTMLElement; x: boolean; y: boolean }[] = [];
let variables: Record<string, string> = {};
let measured: { width: number; height: number } | undefined;

function environment() {
  clipping = [];
  variables = {};
  if (!props.anchor) return;
  for (
    let element = props.anchor.parentElement;
    element;
    element = element.parentElement
  ) {
    const css = getComputedStyle(element);
    const x = /hidden|clip|auto|scroll/.test(css.overflowX || css.overflow);
    const y = /hidden|clip|auto|scroll/.test(css.overflowY || css.overflow);
    if (x || y) clipping.push({ element, x, y });
  }
  const skin = getComputedStyle(props.anchor);
  for (const name of [
    "--hys-ui-text",
    "--hys-ui-surface",
    "--hys-ui-theme-text",
    "--hys-ui-theme-surface",
  ]) {
    const value = skin.getPropertyValue(name).trim();
    if (value) variables[name] = value;
  }
}

function update() {
  frame = undefined;
  const anchor = props.anchor,
    bubble = panel.value;
  if (!props.visible || !active.value || !anchor?.isConnected || !bubble) return;
  const viewport = window.visualViewport;
  const left = viewport?.offsetLeft ?? 0,
    top = viewport?.offsetTop ?? 0;
  const width =
    viewport?.width ??
    (document.documentElement.clientWidth || window.innerWidth);
  const height =
    viewport?.height ??
    (document.documentElement.clientHeight || window.innerHeight);
  const right = left + width,
    bottom = top + height,
    padding = 8,
    gap = 8;
  const handle =
    anchor.querySelector<HTMLElement>(".hys-ui-slider-handle") ?? anchor;
  const a = handle.getBoundingClientRect();
  let clipLeft = left,
    clipTop = top,
    clipRight = right,
    clipBottom = bottom;
  // The bubble escapes clipping containers, but disappears when its handle is
  // scrolled out of them, rather than being pinned to the viewport edge.
  for (const { element: parent, x: clipsX, y: clipsY } of clipping) {
    const rect = parent.getBoundingClientRect();
    if (clipsX) {
      clipLeft = Math.max(clipLeft, rect.left + parent.clientLeft);
      clipRight = Math.min(
        clipRight,
        rect.left + parent.clientLeft + (parent.clientWidth || rect.width),
      );
    }
    if (clipsY) {
      clipTop = Math.max(clipTop, rect.top + parent.clientTop);
      clipBottom = Math.min(
        clipBottom,
        rect.top + parent.clientTop + (parent.clientHeight || rect.height),
      );
    }
  }
  if (
    (!a.width && !a.height) ||
    a.right <= clipLeft ||
    a.left >= clipRight ||
    a.bottom <= clipTop ||
    a.top >= clipBottom
  ) {
    style.value = { position: "fixed", visibility: "hidden" };
    return;
  }
  bubble.style.maxWidth = Math.max(1, width - padding * 2) + "px";
  const p = measured ?? popupSize(bubble);
  const room = {
    top: a.top - top - gap - padding,
    bottom: bottom - a.bottom - gap - padding,
    left: a.left - left - gap - padding,
    right: right - a.right - gap - padding,
  };
  const opposite = {
    top: "bottom",
    bottom: "top",
    left: "right",
    right: "left",
  } as const;
  let side = props.placement;
  const alternate = opposite[side],
    needed = side === "top" || side === "bottom" ? p.height : p.width;
  if (room[side] < needed && room[alternate] > room[side]) side = alternate;
  let x = a.left + (a.width - p.width) / 2,
    y = a.top + (a.height - p.height) / 2;
  if (side === "top") y = a.top - p.height - gap;
  else if (side === "bottom") y = a.bottom + gap;
  else if (side === "left") x = a.left - p.width - gap;
  else x = a.right + gap;
  x = Math.max(left + padding, Math.min(x, right - p.width - padding));
  y = Math.max(top + padding, Math.min(y, bottom - p.height - padding));
  resolvedPlacement.value = side;
  style.value = {
    ...variables,
    position: "fixed",
    left: Math.round(x) + "px",
    top: Math.round(y) + "px",
    maxWidth: Math.max(1, width - padding * 2) + "px",
    visibility: "visible",
  };
}
function schedule() {
  if (props.visible && active.value && frame === undefined)
    frame = requestAnimationFrame(update);
}
function follow() {
  if (frame !== undefined) cancelAnimationFrame(frame);
  frame = undefined;
  // Vue has already committed the handle transform. Follow in this paint,
  // instead of introducing a second animation-frame delay behind the handle.
  update();
}
function resized() {
  measured = undefined;
  environment();
  schedule();
}
function stop() {
  detach?.();
  detach = undefined;
  if (frame !== undefined) cancelAnimationFrame(frame);
  frame = undefined;
  measured = undefined;
  clipping = [];
}
function attach() {
  stop();
  if (!props.visible || !active.value || !props.anchor || !panel.value) return;
  environment();
  window.addEventListener("scroll", schedule, true);
  window.addEventListener("resize", resized);
  window.visualViewport?.addEventListener("scroll", schedule);
  window.visualViewport?.addEventListener("resize", resized);
  const observer =
    typeof ResizeObserver === "undefined"
      ? undefined
      : new ResizeObserver((entries) => {
          for (const entry of entries)
            if (entry.target === panel.value) {
              const box = entry.borderBoxSize?.[0];
              measured = box
                ? { width: box.inlineSize, height: box.blockSize }
                : undefined;
            }
          follow();
        });
  observer?.observe(props.anchor);
  observer?.observe(panel.value);
  if (props.container) observer?.observe(props.container);
  const signature = () =>
    [
      props.container?.getAttribute("style"),
      props.container?.getAttribute("class"),
      hysRootAttrs.value["data-hys-theme"],
    ].join("|");
  let lastEnvironment = signature();
  const mutation =
    typeof MutationObserver === "undefined"
      ? undefined
      : new MutationObserver(() => {
          const next = signature();
          if (next === lastEnvironment) return;
          lastEnvironment = next;
          environment();
          schedule();
        });
  if (props.container)
    mutation?.observe(props.container, {
      attributes: true,
      attributeFilter: ["style", "class", "data-hys-theme"],
    });
  detach = () => {
    window.removeEventListener("scroll", schedule, true);
    window.removeEventListener("resize", resized);
    window.visualViewport?.removeEventListener("scroll", schedule);
    window.visualViewport?.removeEventListener("resize", resized);
    observer?.disconnect();
    mutation?.disconnect();
  };
  schedule();
}
watch(
  () => [props.anchor, props.container, panel.value, active.value, props.visible],
  attach,
  { flush: "post" },
);
watch(() => [props.position, props.placement], follow, { flush: "post" });
watch(
  () => hysRootAttrs.value["data-hys-theme"],
  () => {
    environment();
    follow();
  },
  { flush: "post" },
);
onActivated(() => {
  active.value = true;
  void nextTick(attach);
});
onDeactivated(() => {
  active.value = false;
  stop();
});
onBeforeUnmount(stop);
</script>
<template>
  <Teleport to="body"><PopupMotion :popup-transition="props.popupTransition" :popup-transition-duration="props.popupTransitionDuration" :placement="resolvedPlacement">
    <span
      v-if="active && visible"
      :id="id"
      ref="panel"
      v-bind="hysRootAttrs"
      class="hys-ui-slider-tooltip"
      :class="'hys-ui-slider-tooltip-' + resolvedPlacement"
      role="tooltip"
      :style="style"
      ><slot
    /></span>
  </PopupMotion></Teleport>
</template>
<style scoped>
.hys-ui-slider-tooltip {
  z-index: 1200;
  pointer-events: none;
  width: max-content;
  box-sizing: border-box;
  border-radius: 6px;
  padding: 4px 8px;
  background: var(--hys-ui-text, var(--hys-ui-theme-text));
  color: var(--hys-ui-surface, var(--hys-ui-theme-surface));
  font-family: inherit;
  font-size: 11px;
  line-height: 1.5;
  white-space: normal;
  overflow-wrap: anywhere;
  box-shadow: 0 3px 12px #1727441a;
}
</style>
