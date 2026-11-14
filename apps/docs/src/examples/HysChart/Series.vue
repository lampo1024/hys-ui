<script setup lang="ts">
import { computed, ref } from "vue";
import { HysChart, HysSelect, HysCheckbox, type HysChartSeries } from "hys-ui";

const view = ref<"bar" | "combo">("combo");
const stacked = ref(false);
const seriesTable = ref(false);
const month = ["一月", "二月", "三月", "四月", "五月", "六月"];
const byMonth = (values: number[]) =>
  values.map((value, index) => ({ label: month[index], value }));
const amounts: HysChartSeries[] = [
  { id: "store", name: "门店", data: byMonth([52, 61, 55, 68, 72, 80]) },
  { id: "online", name: "线上", data: byMonth([20, 25, 35, 31, 44, 49]) },
];
const goal: HysChartSeries = {
  id: "goal",
  name: "销售目标",
  type: "line",
  dashed: true,
  data: byMonth([75, 77, 82, 87, 98, 110]),
};
const series = computed(() =>
  view.value === "combo" ? [...amounts, goal] : amounts,
);
</script>

<template>
  <div class="demo-stack">
    <HysChart
      :series="series"
      :type="view"
      :stacked="stacked"
      :show-table="seriesTable"
      :height="260"
      smooth
      :value-formatter="(value) => value + ' 万元'"
    >
      <template #title>销售额与目标</template>
    </HysChart>
    <div class="demo-row">
      <HysSelect
        v-model="view"
        :options="[
          { value: 'combo', label: '柱线组合' },
          { value: 'bar', label: '多系列柱状' },
        ]"
        aria-label="销售图表类型"
        style="width: 145px"
      />
      <HysCheckbox v-model="stacked" label="堆叠柱体" />
      <HysCheckbox v-model="seriesTable" label="显示数据表" />
    </div>
  </div>
</template>
