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
import { computed, onActivated, onDeactivated, ref, useTemplateRef, watch } from "vue";
import { useHysRootAttrs } from "../../config";
import {
  edgeTolerance, nonnegative, previousGaps,
} from "./scrollbarGeometry";
import ScrollbarOverlay from "./ScrollbarOverlay.vue";
import { useScrollbarGeometry } from "./useScrollbarGeometry";

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
const { geometry, update: measure } = useScrollbarGeometry(() => viewport.value, () => view.value, {
  direction: () => props.direction,
  autoResize: () => !props.noresize && (!props.native || !!props.mask),
  observeMutations: true,
  listenScroll: false,
});
const reached = new Set<HysScrollbarEdge>();
let previous: HysScrollbarPosition | undefined;

function length(value?: number | string) {
  if (typeof value !== "number") return value;
  return Number.isFinite(value) ? `${nonnegative(value)}px` : undefined;
}

const dimensions = computed(() => ({ height: length(props.height), maxHeight: length(props.maxHeight) }));
const threshold = computed(() => nonnegative(props.distance) + edgeTolerance);
const orientation = computed(() => props.ariaOrientation === "undefined" ? undefined : props.ariaOrientation);
watch([geometry, threshold], ([next, limit]) => {
  const target = viewport.value;
  if (!target || !next) return;
  for (const edge of reached) {
    const max = edge === "top" || edge === "bottom" ? next.maxY : next.maxX;
    if (!max || next.gaps[edge] > limit) reached.delete(edge);
  }
  previous ??= { scrollTop: target.scrollTop, scrollLeft: target.scrollLeft };
}, { flush: "sync" });

function handleScroll() {
  const target = viewport.value;
  if (!target || !active.value) return;
  const before = previous;
  const area = measure();
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

onActivated(() => { active.value = true; });
onDeactivated(() => { active.value = false; });
defineExpose({ viewport, wrapRef: viewport, handleScroll, scrollTo, scrollBy, setScrollTop, setScrollLeft, update: () => { measure(); } });
</script>

<template>
  <div
    v-bind="skin"
    class="hys-ui-scrollbar-root"
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
    <ScrollbarOverlay :viewport="viewport" :geometry="geometry" :always="always" :min-size="minSize" :native="native" :mask="mask" />
  </div>
</template>

<style scoped src="./scrollbar.css"></style>
