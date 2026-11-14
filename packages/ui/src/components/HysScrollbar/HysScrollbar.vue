<script lang="ts">
import type { ClassValue, StyleValue } from "vue";
import type { ScrollbarEdge } from "./scrollbarGeometry";

export type HysScrollbarDirection = "both" | "vertical" | "horizontal";
export type HysScrollbarEdge = ScrollbarEdge;
export type HysScrollbarMask = boolean | HysScrollbarEdge;

export interface HysScrollbarPosition {
  scrollTop: number;
  scrollLeft: number;
}

export interface HysScrollbarProps {
  height?: number | string;
  maxHeight?: number | string;
  direction?: HysScrollbarDirection;
  tabindex?: number | string | null;
  id?: string;
  role?: string;
  ariaLabel?: string;
  ariaOrientation?: "horizontal" | "vertical" | "undefined";
  native?: boolean;
  wrapClass?: ClassValue;
  wrapStyle?: StyleValue;
  viewClass?: ClassValue;
  viewStyle?: StyleValue;
  tag?: string;
  always?: boolean;
  noresize?: boolean;
  minSize?: number;
  distance?: number;
  mask?: HysScrollbarMask;
}

export interface HysScrollbarInstance {
  viewport: HTMLElement | null;
  wrapRef: HTMLElement | null;
  handleScroll(): void;
  scrollTo(options: ScrollToOptions): void;
  scrollTo(left: number, top: number): void;
  scrollBy(options: ScrollToOptions): void;
  setScrollTop(value: number): void;
  setScrollLeft(value: number): void;
  update(): void;
}
</script>

<script setup lang="ts">
import { computed, onActivated, onDeactivated, ref, shallowRef, useTemplateRef, watch } from "vue";
import { useHysRootAttrs } from "../../config";
import {
  edgeTolerance, nonnegative, previousGaps, readScrollbarGeometry, scrollbarAxes, scrollbarEdges,
  scrollbarThumb, type ScrollbarAxis, type ScrollbarGeometry,
} from "./scrollbarGeometry";
import { useScrollbarDrag } from "./useScrollbarDrag";

const props = withDefaults(defineProps<HysScrollbarProps>(), {
  direction: "both",
  tabindex: 0,
  tag: "div",
  minSize: 20,
  distance: 0,
  mask: false,
});
const emit = defineEmits<{
  scroll: [position: HysScrollbarPosition];
  "end-reached": [edge: HysScrollbarEdge];
}>();
defineSlots<{ default?: () => unknown }>();

const skin = useHysRootAttrs();
const viewport = useTemplateRef<HTMLElement>("viewport");
const view = useTemplateRef<HTMLElement>("view");
const active = ref(true);
const geometry = shallowRef<ScrollbarGeometry>();
const reached = new Set<HysScrollbarEdge>();
let previous: HysScrollbarPosition | undefined;

function length(value?: number | string) {
  if (typeof value !== "number") return value;
  return Number.isFinite(value) ? `${nonnegative(value)}px` : undefined;
}

const dimensions = computed(() => ({ height: length(props.height), maxHeight: length(props.maxHeight) }));
const threshold = computed(() => nonnegative(props.distance) + edgeTolerance);
const orientation = computed(() => props.ariaOrientation === "undefined" ? undefined : props.ariaOrientation);
const overlay = computed(() => {
  const area = geometry.value;
  if (!area || (props.native && !props.mask)) return;
  return { top: `${area.top}px`, left: `${area.left}px`, width: `${area.width}px`, height: `${area.height}px` };
});
const thumbs = computed(() => {
  const area = geometry.value;
  return {
    vertical: area && scrollbarThumb(area, "vertical", props.minSize),
    horizontal: area && scrollbarThumb(area, "horizontal", props.minSize),
  };
});
const masks = computed(() => scrollbarEdges.filter(edge => props.mask === true || props.mask === edge));
const drag = useScrollbarDrag(viewport, geometry, thumbs);

function update() {
  const target = viewport.value;
  if (!target) return;
  const next = readScrollbarGeometry(target, props.direction);
  geometry.value = next;
  for (const edge of reached) {
    const max = edge === "top" || edge === "bottom" ? next.maxY : next.maxX;
    if (!max || next.gaps[edge] > threshold.value) reached.delete(edge);
  }
  previous ??= { scrollTop: target.scrollTop, scrollLeft: target.scrollLeft };
  return next;
}

function handleScroll() {
  const target = viewport.value;
  if (!target || !active.value) return;
  const before = previous;
  const area = update();
  const position = { scrollTop: target.scrollTop, scrollLeft: target.scrollLeft };
  previous = position;
  emit("scroll", position);
  if (!area || !before) return;
  const beforeGaps = previousGaps(area, before);
  const { scrollTop, scrollLeft } = position;
  const edges: HysScrollbarEdge[] = [];
  if (area.maxY > 0 && scrollTop !== before.scrollTop) edges.push(scrollTop > before.scrollTop ? "bottom" : "top");
  if (area.maxX > 0 && scrollLeft !== before.scrollLeft) edges.push(scrollLeft > before.scrollLeft ? "right" : "left");
  for (const edge of edges) {
    if (beforeGaps[edge] > threshold.value) reached.delete(edge);
    if (area.gaps[edge] > threshold.value || reached.has(edge)) continue;
    reached.add(edge);
    emit("end-reached", edge);
  }
}

function scrollTo(options: ScrollToOptions): void;
function scrollTo(left: number, top: number): void;
function scrollTo(value: ScrollToOptions | number, top?: number) {
  const target = viewport.value;
  if (typeof value !== "number") target?.scrollTo(value);
  else if (Number.isFinite(value) && top !== undefined && Number.isFinite(top)) target?.scrollTo(value, top);
}

function scrollBy(options: ScrollToOptions) {
  viewport.value?.scrollBy(options);
}

function setScrollTop(value: number) {
  if (viewport.value && Number.isFinite(value)) viewport.value.scrollTop = value;
}

function setScrollLeft(value: number) {
  if (viewport.value && Number.isFinite(value)) viewport.value.scrollLeft = value;
}

watch([viewport, view, active, () => props.noresize, () => props.native, () => props.direction, () => props.distance, () => props.mask],
  ([target, content, enabled, noresize], _, onCleanup) => {
    if (!target || !content || !enabled) return;
    update();
    if (noresize || (props.native && !props.mask)) return;
    const owner = target.ownerDocument.defaultView;
    if (!owner) return;
    let frame: number | undefined;
    function schedule() {
      if (!owner?.requestAnimationFrame) {
        update();
        return;
      }
      frame ??= owner.requestAnimationFrame(() => {
        frame = undefined;
        update();
      });
    }
    const resize = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(schedule);
    resize?.observe(target);
    resize?.observe(content);
    const mutation = typeof MutationObserver === "undefined" ? undefined : new MutationObserver(schedule);
    mutation?.observe(content, { subtree: true, childList: true, characterData: true, attributes: true, attributeFilter: ["class", "style", "hidden", "dir"] });
    owner.addEventListener("resize", schedule);
    content.addEventListener("load", schedule, true);
    content.addEventListener("transitionend", schedule);
    content.addEventListener("animationend", schedule);
    onCleanup(() => {
      if (frame !== undefined) owner.cancelAnimationFrame(frame);
      resize?.disconnect();
      mutation?.disconnect();
      owner.removeEventListener("resize", schedule);
      content.removeEventListener("load", schedule, true);
      content.removeEventListener("transitionend", schedule);
      content.removeEventListener("animationend", schedule);
    });
  }, { flush: "post" });

onActivated(() => { active.value = true; });
onDeactivated(() => {
  active.value = false;
  drag.stop();
});
watch(() => props.native, (native) => { if (native) drag.stop(); });

const hasThumb = (axis: ScrollbarAxis) => !props.native && thumbs.value[axis];
defineExpose({ viewport, wrapRef: viewport, handleScroll, scrollTo, scrollBy, setScrollTop, setScrollLeft, update: () => { update(); } });
</script>

<template>
  <div
    v-bind="skin"
    class="hys-ui-scrollbar-root"
    :class="{ 'hys-ui-scrollbar-always': always, 'hys-ui-scrollbar-dragging': drag.dragging.value }"
    :style="dimensions"
  >
    <div
      ref="viewport"
      class="hys-ui-scrollbar-viewport"
      :class="[native ? 'hys-ui-scrollbar-native' : 'hys-ui-scrollbar-custom', wrapClass]"
      :data-direction="direction"
      :style="wrapStyle"
      :tabindex="tabindex ?? undefined"
      :role="ariaLabel && !role ? 'region' : undefined"
      :aria-label="role ? undefined : ariaLabel"
      :aria-orientation="role ? undefined : orientation"
      @scroll.passive="handleScroll"
    >
      <component
        :is="tag"
        :id="id"
        ref="view"
        class="hys-ui-scrollbar-view"
        :class="viewClass"
        :style="viewStyle"
        :role="role"
        :aria-label="role ? ariaLabel : undefined"
        :aria-orientation="role ? orientation : undefined"
      ><slot /></component>
    </div>
    <div v-if="overlay" class="hys-ui-scrollbar-overlay" :style="overlay" aria-hidden="true">
      <div
        v-for="edge in masks"
        :key="edge"
        class="hys-ui-scrollbar-mask"
        :data-edge="edge"
        :data-visible="geometry && geometry.gaps[edge] > edgeTolerance ? '' : undefined"
      />
      <template v-for="axis in scrollbarAxes" :key="axis">
        <div
          v-if="hasThumb(axis)"
          class="hys-ui-scrollbar-track"
          :data-axis="axis"
          :data-corner="(axis === 'vertical' ? geometry?.maxX : geometry?.maxY) ? '' : undefined"
          @pointerdown="drag.start($event, axis)"
          @pointermove="drag.move"
          @pointerup="drag.finish"
          @pointercancel="drag.finish"
          @lostpointercapture="drag.finish"
        >
          <div
            class="hys-ui-scrollbar-thumb"
            :style="{ '--hys-scrollbar-thumb-size': `${thumbs[axis]?.size}px`, '--hys-scrollbar-offset': `${thumbs[axis]?.offset}px` }"
          />
        </div>
      </template>
    </div>
  </div>
</template>

<style scoped src="./scrollbar.css"></style>
