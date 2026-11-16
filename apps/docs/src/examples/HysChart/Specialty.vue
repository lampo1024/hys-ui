<script setup lang="ts">
import { computed, ref } from "vue";
import { HysChart, HysCheckbox, HysSelect, type HysChartSeries } from "hys-ui";

const view = ref<"radar" | "funnel" | "gauge" | "heatmap">("radar");
const values = ref(true);
const table = ref(false);
const options = [
  { value: "radar", label: "雷达图" },
  { value: "funnel", label: "漏斗图" },
  { value: "gauge", label: "仪表盘" },
  { value: "heatmap", label: "热力图" },
];
const dimensions = ["可用性", "响应速度", "稳定性", "可维护性", "客户满意度"];
const evaluation = (
  id: string,
  name: string,
  numbers: number[],
): HysChartSeries => ({
  id,
  name,
  data: dimensions.map((label, index) => ({ label, value: numbers[index] })),
});
const sources: Record<typeof view.value, HysChartSeries[]> = {
  radar: [
    evaluation("this", "本季度", [92, 78, 88, 84, 94]),
    evaluation("last", "上季度", [82, 67, 74, 78, 90]),
  ],
  funnel: [
    {
      name: "转化人数",
      data: ["浏览", "查看详情", "加入购物车", "完成支付"].map(
        (label, index) => ({
          label,
          value: [4500, 2700, 1430, 850][index],
        }),
      ),
    },
  ],
  gauge: [{ name: "目标完成率", data: [{ label: "当前完成率", value: 76 }] }],
  heatmap: ["周一", "周二", "周三", "周四", "周五"].map((name, row) => ({
    id: String(row),
    name,
    data: ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00"].map(
      (label, col) => ({
        label,
        value:
          row === 2 && col === 3
            ? null
            : 10 + (((col + 2) * (row + 19) * 37) % 85),
      }),
    ),
  })),
};
const names = {
  radar: "服务质量评分",
  funnel: "购买转化路径",
  gauge: "月度目标完成率",
  heatmap: "工作日请求量",
};
const format = computed(() =>
  view.value === "gauge" ? (value: number) => value + "%" : undefined,
);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysSelect
        v-model="view"
        :options="options"
        aria-label="选择图表类型"
        style="width: 140px"
      />
      <HysCheckbox v-model="values" label="显示数值" />
      <HysCheckbox v-model="table" label="显示明细" />
    </div>
    <HysChart
      :type="view"
      :series="sources[view]"
      :show-table="table"
      :show-values="values"
      :show-legend="view === 'radar' || view === 'heatmap'"
      :y-axis="{ min: 0, max: 100 }"
      :height="240"
      :value-formatter="format"
      :aria-label="names[view]"
    >
      <template #title>{{ names[view] }}</template>
    </HysChart>
  </div>
</template>
