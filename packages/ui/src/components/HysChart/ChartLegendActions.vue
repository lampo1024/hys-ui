<script setup lang="ts">
import { computed, ref } from "vue";
import HysButton from "../HysButton/HysButton.vue";
import HysSelect from "../HysSelect/HysSelect.vue";
import HysPopover from "../HysPopover/HysPopover.vue";
import type { ChartLegendEntry } from "./chartModel";

const props = defineProps<{
  items: readonly ChartLegendEntry[];
  hidden: ReadonlySet<string>;
}>();
const emit = defineEmits<{ apply: [keys: ReadonlySet<string>] }>();
const selectedSeries = ref<string>();
const selectedGroup = ref<string>();
const options = computed(() =>
  props.items.map(({ key, label }) => ({ value: key, label })),
);
const groupName = (item: ChartLegendEntry) => item.group?.trim() || "未分组";
const groups = computed(() =>
  Array.from(new Set(props.items.map(groupName)), (label) => ({
    value: label,
    label,
  })),
);
const hasSelectedSeries = computed(() =>
  options.value.some((item) => item.value === selectedSeries.value),
);
const hasHiddenGroupMembers = computed(() =>
  props.items.some(
    (item) =>
      groupName(item) === selectedGroup.value && props.hidden.has(item.key),
  ),
);
const hasHidden = computed(() =>
  props.items.some((item) => props.hidden.has(item.key)),
);

function apply(action: "series" | "group" | "all") {
  const hidden = new Set(props.hidden);
  for (const item of props.items) {
    if (action === "series" && item.key !== selectedSeries.value)
      hidden.add(item.key);
    else if (action !== "group" || groupName(item) === selectedGroup.value)
      hidden.delete(item.key);
  }
  emit("apply", hidden);
}
</script>

<template>
  <HysPopover
    trigger="click"
    placement="bottom-end"
    :width="290"
    max-width="calc(100vw - 20px)"
    aria-label="图例批量操作"
  >
    <template #trigger
      ><HysButton size="sm" variant="secondary">图例操作</HysButton></template
    >
    <template #default="{ close }">
      <div class="hys-chart-legend-actions">
        <div class="hys-chart-legend-action-row">
          <HysSelect
            v-model="selectedSeries"
            :options="options"
            size="sm"
            filterable
            :append-to="false"
            placeholder="选择系列"
            aria-label="选择要单独显示的系列"
          />
          <HysButton
            size="sm"
            variant="ghost"
            :disabled="!hasSelectedSeries"
            @click.stop="
              apply('series');
              close();
            "
            >只看此系列</HysButton
          >
        </div>
        <div class="hys-chart-legend-action-row">
          <HysSelect
            v-model="selectedGroup"
            :options="groups"
            size="sm"
            :append-to="false"
            placeholder="选择分组"
            aria-label="选择要显示的分组"
          />
          <HysButton
            size="sm"
            variant="ghost"
            :disabled="!hasHiddenGroupMembers"
            @click.stop="
              apply('group');
              close();
            "
            >显示分组</HysButton
          >
        </div>
        <div class="hys-chart-legend-action-footer">
          <HysButton
            size="sm"
            variant="ghost"
            :disabled="!hasHidden"
            @click.stop="
              apply('all');
              close();
            "
            >恢复全部</HysButton
          >
        </div>
      </div>
    </template>
  </HysPopover>
</template>

<style scoped>
.hys-chart-legend-actions {
  display: grid;
  gap: 6px;
  min-inline-size: 0;
}
.hys-chart-legend-action-row {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: center;
  gap: 4px;
}
.hys-chart-legend-action-row :deep(.hys-ui-select-wrap) {
  min-inline-size: 0;
}
.hys-chart-legend-action-footer {
  border-block-start: 1px solid var(--hys-ui-theme-border);
  padding-block-start: 4px;
}
</style>
