<script setup lang="ts">
import { computed, toRef, watch } from "vue";
import { clamp, edgeTolerance, scrollbarAxes, scrollbarEdges, scrollbarThumb, type ScrollbarEdge, type ScrollbarGeometry } from "./scrollbarGeometry";
import { useScrollbarDrag } from "./useScrollbarDrag";

const props = withDefaults(defineProps<{
  viewport: HTMLElement | null | undefined;
  geometry?: ScrollbarGeometry;
  always?: boolean;
  minSize?: number;
  native?: boolean;
  mask?: boolean | ScrollbarEdge;
}>(), { minSize: 20 });

const thumbs = computed(() => {
  const area = props.geometry;
  return {
    vertical: area && !props.native ? scrollbarThumb(area, "vertical", props.minSize) : undefined,
    horizontal: area && !props.native ? scrollbarThumb(area, "horizontal", props.minSize) : undefined,
  };
});
const overlay = computed(() => {
  const area = props.geometry;
  if (!area || (!props.mask && !thumbs.value.vertical && !thumbs.value.horizontal)) return;
  return { top: `${area.top}px`, left: `${area.left}px`, width: `${area.width}px`, height: `${area.height}px` };
});
const masks = computed(() => scrollbarEdges.filter(edge => props.mask === true || props.mask === edge));
const drag = useScrollbarDrag(() => props.viewport, toRef(props, "geometry"), thumbs);
watch([() => props.viewport, () => props.native], drag.stop);
watch(thumbs, (value) => {
  const axis = drag.dragging.value?.axis;
  if (axis && !value[axis]) drag.stop();
});

function wheelTrack(event: WheelEvent) {
  const viewport = props.viewport;
  const area = props.geometry;
  if (!viewport || !area || event.ctrlKey) return;
  const style = getComputedStyle(viewport);
  const line = event.deltaMode === 1 ? (parseFloat(style.lineHeight) || 16) : 1;
  const origin = area.rtl ? area.maxX : 0;
  const left = clamp(viewport.scrollLeft + origin + event.deltaX * (event.deltaMode === 2 ? area.width : line), area.maxX) - origin;
  const top = clamp(viewport.scrollTop + event.deltaY * (event.deltaMode === 2 ? area.height : line), area.maxY);
  if (left !== viewport.scrollLeft || top !== viewport.scrollTop ||
      (event.deltaX && /^(contain|none)$/.test(style.overscrollBehaviorX)) ||
      (event.deltaY && /^(contain|none)$/.test(style.overscrollBehaviorY))) {
    event.preventDefault();
    viewport.scrollTo({ left, top, behavior: "instant" });
  }
}
</script>

<template>
  <div
    v-if="overlay"
    class="hys-ui-scrollbar-overlay"
    :class="{ 'hys-ui-scrollbar-always': always, 'hys-ui-scrollbar-dragging': drag.dragging.value }"
    :style="overlay"
    aria-hidden="true"
  >
    <div
      v-for="edge in masks"
      :key="edge"
      class="hys-ui-scrollbar-mask"
      :data-edge="edge"
      :data-visible="geometry && geometry.gaps[edge] > edgeTolerance ? '' : undefined"
    />
    <template v-for="axis in scrollbarAxes" :key="axis">
      <div
        v-if="thumbs[axis]"
        class="hys-ui-scrollbar-track"
        :data-axis="axis"
        :data-corner="(axis === 'vertical' ? geometry?.maxX : geometry?.maxY) ? '' : undefined"
        @pointerdown="drag.start($event, axis)"
        @pointermove="drag.move"
        @pointerup="drag.finish"
        @pointercancel="drag.finish"
        @lostpointercapture="drag.finish"
        @wheel="wheelTrack"
      >
        <div
          class="hys-ui-scrollbar-thumb"
          :style="{ '--hys-scrollbar-thumb-size': `${thumbs[axis]?.size}px`, '--hys-scrollbar-offset': `${thumbs[axis]?.offset}px` }"
        />
      </div>
    </template>
  </div>
</template>

<style src="./scrollbarOverlay.css"></style>
