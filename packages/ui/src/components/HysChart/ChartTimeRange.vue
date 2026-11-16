<script setup lang="ts">
import { computed, nextTick } from "vue";
import HysDateRangePicker from "../HysDateRangePicker/HysDateRangePicker.vue";
import type { HysDateShortcut } from "../../composables/datePicker";
import type { HysChartRange, HysChartRangePreset } from "./chartTypes";

const props = defineProps<{
  domain: HysChartRange;
  visible: HysChartRange;
  presets?: readonly HysChartRangePreset[];
}>();
const emit = defineEmits<{ range: [range: HysChartRange] }>();
const day = 86_400_000;
const isoDate = (time: number) => new Date(time).toISOString().split("T")[0];
const dates = computed<[string, string]>(() => [
  isoDate(props.visible.start),
  isoDate(props.visible.end),
]);
const shortcuts = computed<HysDateShortcut[]>(() => {
  const { start, end } = props.domain;
  const finalDay = Math.floor(end / day) * day;
  return (props.presets ?? []).flatMap(({ label, days }) => {
    if (!label || (days !== undefined && (!Number.isFinite(days) || days < 1)))
      return [];
    const beginning =
      days === undefined
        ? start
        : Math.max(start, finalDay - (Math.floor(days) - 1) * day);
    const value: [string, string] = [isoDate(beginning), isoDate(end)];
    return [
      {
        label,
        value: () => {
          // Applying a shortcut also restores the day bounds after intraday zoom.
          if (value[0] === dates.value[0] && value[1] === dates.value[1])
            void nextTick(() => chooseDates(value));
          return value;
        },
      },
    ];
  });
});
function chooseDates(next: [string, string]) {
  if (!next?.[0] || !next?.[1]) return;
  const start = Date.parse(next[0] + "T00:00:00.000Z");
  const end = Date.parse(next[1] + "T00:00:00.000Z") + day - 1;
  if (Number.isFinite(start) && Number.isFinite(end) && start <= end)
    emit("range", { start, end });
}
</script>

<template>
  <HysDateRangePicker
    :model-value="dates"
    :shortcuts="shortcuts"
    :min="isoDate(domain.start)"
    :max="isoDate(domain.end)"
    aria-label="起止日期"
    size="sm"
    class="hys-chart-date-range"
    @update:model-value="chooseDates"
  />
</template>

<style scoped>
.hys-chart-date-range {
  flex: 0 1 252px;
  min-inline-size: min(216px, 100%);
  max-inline-size: 100%;
}
</style>
