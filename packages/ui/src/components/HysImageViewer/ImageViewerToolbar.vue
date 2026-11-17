<script setup lang="ts">
import { computed } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysTooltip from "../HysTooltip/HysTooltip.vue";
import {
  ChevronLeft,
  ChevronRight,
  Maximize2,
  ScanLine,
  Minus,
  Plus,
  RotateCcw,
  RotateCw,
} from "../HysIcon/svgIcons";
import type { HysImageViewerLabels } from "./imageViewerLabels";

const props = defineProps<{
  index: number;
  count: number;
  ready: boolean;
  zoom: number;
  factor: number;
  labels: HysImageViewerLabels;
  loop?: boolean;
}>();
const emit = defineEmits<{
  move: [offset: number];
  zoom: [offset: number];
  rotate: [];
  reset: [];
  fit: [];
  actual: [];
}>();
const tools = computed(() => [
  {
    label: props.labels.zoomOut,
    icon: Minus,
    disabled: !props.ready || props.factor <= 0.25,
    action: () => emit("zoom", -0.25),
  },
  {
    label: props.labels.zoomIn,
    icon: Plus,
    disabled: !props.ready || props.factor >= 4,
    action: () => emit("zoom", 0.25),
  },
  {
    label: props.labels.rotate,
    icon: RotateCw,
    disabled: !props.ready,
    action: () => emit("rotate"),
  },
  {
    label: props.labels.fit,
    icon: Maximize2,
    disabled: !props.ready,
    action: () => emit("fit"),
  },
  {
    label: props.labels.actual,
    icon: ScanLine,
    disabled: !props.ready,
    action: () => emit("actual"),
  },
  {
    label: props.labels.reset,
    icon: RotateCcw,
    disabled: !props.ready,
    action: () => emit("reset"),
  },
]);
</script>

<template>
  <div class="hys-image-tools" role="group" :aria-label="labels.tools">
    <div v-if="count > 1" class="hys-image-tool-group">
      <HysTooltip
        :text="labels.previous"
        placement="top"
        :trigger-keys="[]"
        :disabled="!loop && index === 0"
      >
        <HysButton
          size="sm"
          variant="ghost"
          :icon="ChevronLeft"
          :aria-label="labels.previous"
          :disabled="!loop && index === 0"
          @click="emit('move', -1)"
        />
      </HysTooltip>
      <span class="hys-image-tool-value" aria-live="polite"
        >{{ index + 1 }} / {{ count }}</span
      >
      <HysTooltip
        :text="labels.next"
        placement="top"
        :trigger-keys="[]"
        :disabled="!loop && index >= count - 1"
      >
        <HysButton
          size="sm"
          variant="ghost"
          :icon="ChevronRight"
          :aria-label="labels.next"
          :disabled="!loop && index >= count - 1"
          @click="emit('move', 1)"
        />
      </HysTooltip>
    </div>
    <div class="hys-image-tool-group">
      <HysTooltip
        v-for="tool in tools"
        :key="tool.label"
        :text="tool.label"
        placement="top"
        :trigger-keys="[]"
        :disabled="tool.disabled"
      >
        <HysButton
          size="sm"
          variant="ghost"
          :icon="tool.icon"
          :aria-label="tool.label"
          :disabled="tool.disabled"
          @click="tool.action"
        />
      </HysTooltip>
      <span v-if="ready" class="hys-image-tool-value" aria-live="polite"
        >{{ zoom }}%</span
      >
    </div>
  </div>
</template>

<style scoped>
.hys-image-tools,
.hys-image-tool-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  align-items: center;
  min-width: 0;
}
.hys-image-tools {
  flex: 1 1 100%;
  justify-content: space-between;
}
.hys-image-tool-value {
  white-space: nowrap;
  color: var(--hys-ui-theme-muted);
  font-size: 12px;
  font-variant-numeric: tabular-nums;
}
</style>
