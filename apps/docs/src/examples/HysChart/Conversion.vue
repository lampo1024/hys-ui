<script setup lang="ts">
import { shallowRef } from "vue";
import { HysChart, type HysChartSelection, type HysChartSeries } from "hys-ui";

const picked = shallowRef<HysChartSelection>();
const series: HysChartSeries[] = [
  {
    name: "搜索投放",
    data: [
      { label: "品牌词", x: 120, value: 6.4 },
      { label: "品类词", x: 240, value: 4.1 },
      { label: "长尾词", x: 85, value: 5.7 },
    ],
  },
  {
    name: "内容投放",
    data: [
      { label: "短视频", x: 260, value: 3.2 },
      { label: "测评", x: 150, value: 4.8 },
      { label: "达人直播", x: 360, value: 5.5 },
    ],
  },
];
</script>

<template>
  <div class="demo-stack">
    <HysChart
      :series="series"
      type="scatter"
      :height="244"
      :reference="{ value: 5, label: '转化目标 5%' }"
      :axis-formatter="
        (value, axis) => (axis === 'y' ? value + '%' : value + ' 元')
      "
      :value-formatter="(value) => value + '%'"
      @point-click="picked = $event"
      aria-label="投放成本与转化率"
    >
      <template #title>投放成本与转化率</template>
    </HysChart>
    <output aria-live="polite">{{
      picked
        ? `${picked.point.label} · 成本 ${picked.x} 元 · 转化率 ${picked.point.value}%`
        : "点击数据点，或聚焦后按 Enter 查看明细。"
    }}</output>
  </div>
</template>
