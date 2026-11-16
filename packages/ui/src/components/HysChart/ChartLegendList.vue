<script setup lang="ts">
import { computed, ref } from "vue";
import HysInput from "../HysInput/HysInput.vue";
import HysScrollbar from "../HysScrollbar/HysScrollbar.vue";
import ChartLegendButton from "./ChartLegendButton.vue";
import type { ChartLegendEntry } from "./chartModel";

const props = withDefaults(
  defineProps<{
    items: readonly ChartLegendEntry[];
    hidden: ReadonlySet<string>;
    height?: number;
    showValues?: boolean;
  }>(),
  { height: 228 },
);
defineEmits<{ toggle: [key: string] }>();
const query = ref("");
const filtered = computed(() => {
  const term = query.value.trim().toLocaleLowerCase();
  if (!term) return props.items;
  return props.items.filter(({ label, shortLabel, group }) =>
    [label, shortLabel, group].some((value) =>
      value?.toLocaleLowerCase().includes(term),
    ),
  );
});
</script>

<template>
  <div class="hys-chart-legend-panel">
    <HysInput
      v-model="query"
      aria-label="搜索图例"
      placeholder="搜索图例"
      size="sm"
      clearable
    />
    <HysScrollbar
      v-if="filtered.length"
      direction="vertical"
      :max-height="height"
      aria-label="图例列表"
      class="hys-chart-legend-items"
    >
      <div class="hys-chart-legend-list">
        <ChartLegendButton
          v-for="item in filtered"
          :key="item.key"
          :item="item"
          :visible="!hidden.has(item.key)"
          :show-value="showValues"
          stretch
          wrap
          @toggle="$emit('toggle', item.key)"
        />
      </div>
    </HysScrollbar>
    <p v-else class="hys-chart-legend-empty" role="status">没有匹配的图例</p>
  </div>
</template>

<style scoped>
.hys-chart-legend-panel {
  display: grid;
  gap: 8px;
  min-inline-size: 0;
}
.hys-chart-legend-list {
  display: grid;
  gap: 3px;
  padding: 2px 3px;
}
.hys-chart-legend-empty {
  margin: 0;
  padding-block: 8px;
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
</style>
