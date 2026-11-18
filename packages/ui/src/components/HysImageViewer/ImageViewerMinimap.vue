<script setup lang="ts">
import { computed, useTemplateRef } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import { GripHorizontal } from "../HysIcon/svgIcons";

type Size = { width: number; height: number };
type Position = { left: number; top: number };
type Point = { x: number; y: number };

const props = defineProps<{
  src: string;
  label: string;
  moveLabel: string;
  turns: number;
  geometry: Size & { canvasWidth: number; canvasHeight: number };
  bounds: Size;
  position: Position;
  zooming: boolean;
}>();
const placement = defineModel<Point>("placement", { required: true });
const emit = defineEmits<{ pan: [position: Position] }>();
const picture = useTemplateRef<HTMLElement>("picture");

const image = computed(() => {
  const { width, height, canvasWidth, canvasHeight } = props.geometry;
  const sideways = props.turns % 2 !== 0;
  const w = sideways ? height : width;
  const h = sideways ? width : height;
  return { width: w, height: h, left: (canvasWidth - w) / 2, top: (canvasHeight - h) / 2 };
});
const inset = 12;
const handleWidth = 24;
const handleSpace = 23;
const layout = computed(() => {
  const { width, height } = image.value;
  const mapWidth = Math.min(144, Math.max(80, props.bounds.width * .24), props.bounds.width - 2 * inset);
  const mapHeight = Math.min(94, props.bounds.height - 2 * inset - handleSpace);
  const scale = Math.min(mapWidth / width, mapHeight / height);
  const w = Math.max(1, Math.round(width * scale));
  const h = Math.max(1, Math.round(height * scale));
  return {
    width: w,
    height: h,
    travelX: Math.max(0, props.bounds.width - 2 * inset - Math.max(handleWidth, w)),
    travelY: Math.max(0, props.bounds.height - 2 * inset - h - handleSpace),
  };
});
const offset = computed(() => ({
  left: placement.value.x * layout.value.travelX,
  top: placement.value.y * layout.value.travelY,
}));
const fraction = (offset: number, size: number) => Math.max(0, Math.min(1, offset / size));
const frame = computed(() => {
  const { left, top, width, height } = image.value;
  const x = props.position.left - left;
  const y = props.position.top - top;
  return {
    left: fraction(x, width),
    top: fraction(y, height),
    right: fraction(x + props.bounds.width, width),
    bottom: fraction(y + props.bounds.height, height),
  };
});
const percent = (value: number) => value * 100 + "%";

let panDrag: { id: number; x: number; y: number } | undefined;
function point(event: PointerEvent) {
  const rect = picture.value?.getBoundingClientRect();
  if (!rect?.width || !rect.height) return;
  return {
    x: fraction(event.clientX - rect.left, rect.width),
    y: fraction(event.clientY - rect.top, rect.height),
  };
}
function panTo(x: number, y: number, offsetX = 0, offsetY = 0) {
  emit("pan", {
    left: image.value.left + x * image.value.width - props.bounds.width / 2 - offsetX,
    top: image.value.top + y * image.value.height - props.bounds.height / 2 - offsetY,
  });
}
function capture(event: PointerEvent) {
  (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
}
function startPan(event: PointerEvent) {
  if (event.button !== 0 || panDrag) return;
  const target = point(event);
  if (!target) return;
  const { x, y } = target;
  const { left, top, right, bottom } = frame.value;
  const inside = x >= left && x <= right && y >= top && y <= bottom;
  panDrag = {
    id: event.pointerId,
    x: inside ? image.value.left + x * image.value.width - props.position.left - props.bounds.width / 2 : 0,
    y: inside ? image.value.top + y * image.value.height - props.position.top - props.bounds.height / 2 : 0,
  };
  capture(event);
  if (!inside) panTo(x, y);
}
function movePan(event: PointerEvent) {
  if (panDrag?.id !== event.pointerId) return;
  const target = point(event);
  if (target) panTo(target.x, target.y, panDrag.x, panDrag.y);
}
function stopPan(event: PointerEvent) {
  if (panDrag?.id === event.pointerId) panDrag = undefined;
}

let mapDrag: { id: number; x: number; y: number; left: number; top: number } | undefined;
function startMove(event: PointerEvent) {
  if (event.button !== 0 || mapDrag) return;
  mapDrag = { id: event.pointerId, x: event.clientX, y: event.clientY, ...offset.value };
  capture(event);
}
function setOffset(left: number, top: number) {
  const { travelX, travelY } = layout.value;
  placement.value = {
    x: travelX ? fraction(left, travelX) : placement.value.x,
    y: travelY ? fraction(top, travelY) : placement.value.y,
  };
}
function moveMap(event: PointerEvent) {
  if (mapDrag?.id !== event.pointerId) return;
  setOffset(mapDrag.left + event.clientX - mapDrag.x, mapDrag.top + event.clientY - mapDrag.y);
}
function stopMove(event: PointerEvent) {
  if (mapDrag?.id === event.pointerId) mapDrag = undefined;
}
function direction(event: KeyboardEvent) {
  if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
  const x = event.key === "ArrowLeft" ? -1 : event.key === "ArrowRight" ? 1 : 0;
  const y = event.key === "ArrowUp" ? -1 : event.key === "ArrowDown" ? 1 : 0;
  if (x || y) {
    event.preventDefault();
    return { x, y };
  }
}
function panKey(event: KeyboardEvent) {
  const delta = direction(event);
  if (!delta) return;
  emit("pan", {
    left: props.position.left + delta.x * props.bounds.width * 0.15,
    top: props.position.top + delta.y * props.bounds.height * 0.15,
  });
}
function moveKey(event: KeyboardEvent) {
  const delta = direction(event);
  if (delta) setOffset(offset.value.left + delta.x * 16, offset.value.top + delta.y * 16);
}
</script>

<template>
  <div class="hys-image-minimap" :style="{ left: inset + offset.left + 'px', top: inset + offset.top + 'px' }">
    <HysButton
      class="minimap-handle"
      variant="secondary"
      size="sm"
      :icon="GripHorizontal"
      :aria-label="moveLabel"
      @pointerdown="startMove"
      @pointermove="moveMap"
      @pointerup="stopMove"
      @pointercancel="stopMove"
      @lostpointercapture="stopMove"
      @keydown="moveKey"
      @click="$event.detail === 0 && (placement = { x: 1, y: 1 })"
    />
    <HysButton
      class="minimap-preview"
      variant="ghost"
      size="sm"
      :style="{ width: layout.width + 'px', height: layout.height + 'px' }"
      :aria-label="label"
      @pointerdown="startPan"
      @pointermove="movePan"
      @pointerup="stopPan"
      @pointercancel="stopPan"
      @lostpointercapture="stopPan"
      @keydown="panKey"
      @click="$event.detail === 0 && panTo(0.5, 0.5)"
    >
      <span ref="picture" class="hys-image-minimap-picture" aria-hidden="true">
        <img :src="src" alt="" draggable="false" :style="{
          width: percent(geometry.width / image.width),
          height: percent(geometry.height / image.height),
          transform: 'translate(-50%, -50%) rotate(' + turns * 90 + 'deg)',
        }" />
        <span class="hys-image-minimap-frame" :class="{ 'is-zooming': zooming }" :style="{
          left: percent(frame.left),
          top: percent(frame.top),
          width: percent(frame.right - frame.left),
          height: percent(frame.bottom - frame.top),
        }" />
      </span>
    </HysButton>
  </div>
</template>

<style scoped>
.hys-image-minimap {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
  direction: ltr;
}
.minimap-handle {
  box-sizing: border-box;
  width: 24px;
  height: 20px;
  min-height: 0;
  padding: 0;
  border-radius: 5px;
  cursor: grab;
  touch-action: none;
}
.minimap-handle:active {
  cursor: grabbing;
}
.minimap-preview {
  min-height: 0;
  padding: 0;
  border: 0;
  border-radius: 5px;
  outline: 1px solid var(--hys-ui-theme-border);
  box-shadow: 0 2px 8px rgb(0 0 0 / 14%);
  cursor: move;
  touch-action: none;
}
.hys-image-minimap-picture {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
  overflow: hidden;
  border-radius: inherit;
  pointer-events: none;
}
.hys-image-minimap-picture img {
  position: absolute;
  top: 50%;
  left: 50%;
  max-width: none;
  user-select: none;
}
.hys-image-minimap-frame {
  position: absolute;
  box-sizing: border-box;
  border: 1px solid var(--hys-ui-theme-primary);
  box-shadow: inset 0 0 0 1px rgb(255 255 255 / 90%), 0 0 0 150px rgb(11 20 38 / 32%);
}
.hys-image-minimap-frame.is-zooming {
  transition: left 145ms ease-out, top 145ms ease-out, width 145ms ease-out, height 145ms ease-out;
}
</style>
