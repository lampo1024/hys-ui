<script setup lang="ts">
import { computed } from "vue";
import { ChevronsLeftRight, ChevronsUpDown } from "lucide-vue-next";
import HysButton from "../../HysButton/HysButton.vue";
import HysTooltip from "../../HysTooltip/HysTooltip.vue";
import { columnLabel } from "../spreadsheetModel";
import { useSpreadsheetMessages } from "../spreadsheetMessages";
import type { HiddenAxisRange } from "../spreadsheetHiddenAxes";
import type { HysSpreadsheetAxis } from "../spreadsheetTypes";

const props = defineProps<{
  axis: HysSpreadsheetAxis;
  range: HiddenAxisRange;
  readonly?: boolean;
}>();
const emit = defineEmits<{ reveal: [] }>();
const message = useSpreadsheetMessages();
const label = computed(() => {
  const { start, end } = props.range;
  const row = props.axis === "row";
  const address = row ? (i: number) => String(i + 1) : columnLabel;
  const text = address(start) + (end === start ? "" : `–${address(end)}`);
  if (props.readonly)
    return message(row ? "已隐藏的行：{range}" : "已隐藏的列：{range}").replace(
      "{range}",
      text,
    );
  return message(row ? "取消隐藏行 {range}" : "取消隐藏列 {range}").replace(
    "{range}",
    text,
  );
});
</script>

<template>
  <HysTooltip
    class="hidden-axis-marker"
    :data-axis="axis"
    :data-side="range.side"
    :text="label"
    :placement="axis === 'row' ? 'right' : 'bottom'"
    :show-delay="350"
    :trigger="['hover', 'focus']"
    :trigger-keys="[]"
  >
    <span v-if="readonly" class="marker-control" role="img" :aria-label="label">
      <component
        :is="axis === 'row' ? ChevronsUpDown : ChevronsLeftRight"
        :size="12"
        aria-hidden="true"
      />
    </span>
    <HysButton
      v-else
      class="marker-control"
      size="sm"
      variant="ghost"
      :aria-label="label"
      :icon="axis === 'row' ? ChevronsUpDown : ChevronsLeftRight"
      @click.stop="emit('reveal')"
    />
  </HysTooltip>
</template>

<style scoped>
.hidden-axis-marker.hys-ui-tooltip-wrap {
  position: absolute;
  z-index: 2;
  --marker-ink: var(--hys-ui-theme-primary);
}
.hidden-axis-marker[data-axis="row"] {
  inset-inline-start: 0;
}
.hidden-axis-marker[data-axis="row"][data-side="before"] {
  inset-block-start: 0;
}
.hidden-axis-marker[data-axis="row"][data-side="after"] {
  inset-block-end: 0;
}
.hidden-axis-marker[data-axis="column"] {
  inset-block-start: 0;
}
.hidden-axis-marker[data-axis="column"][data-side="before"] {
  inset-inline-start: 0;
}
.hidden-axis-marker[data-axis="column"][data-side="after"] {
  inset-inline-end: 0;
}
.hidden-axis-marker .marker-control {
  display: grid;
  place-items: center;
  inline-size: 14px;
  block-size: 14px;
  min-block-size: 0;
  padding: 0;
  border: 0;
  border-radius: 3px;
  background: var(--hys-ui-theme-primary-soft);
  color: var(--marker-ink);
}
.hidden-axis-marker .marker-control:is(:hover, :focus-visible) {
  background: var(--hys-ui-theme-primary-soft);
  color: var(--marker-ink);
}
.hidden-axis-marker .marker-control:focus-visible {
  outline: 1px solid var(--marker-ink);
  outline-offset: -1px;
}
.hidden-axis-marker :deep(svg) {
  inline-size: 12px;
  block-size: 12px;
}
</style>
