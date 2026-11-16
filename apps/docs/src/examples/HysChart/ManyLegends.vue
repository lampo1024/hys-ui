<script setup lang="ts">
import { computed, ref, useTemplateRef } from "vue";
import {
  HysChart,
  HysButton,
  HysPopover,
  HysSelect,
  type HysChartLegendLayout,
  type HysChartSeries,
  type HysChartCursor,
  type HysChartExportFormat,
  type HysChartRange,
  type HysChartRangePreset,
} from "hys-ui";

const citiesByRegion = {
  华北: ["北京", "天津", "太原", "石家庄"],
  华东: [
    "上海",
    "杭州",
    "南京",
    "苏州",
    "济南",
    "青岛",
    "合肥",
    "宁波",
    "福州",
    "厦门",
    "南昌",
  ],
  华南: ["广州", "深圳", "南宁"],
  华中: ["武汉", "长沙", "郑州"],
  西部: ["成都", "重庆", "西安", "昆明", "贵阳"],
  东北: ["哈尔滨", "沈阳", "长春", "大连"],
};
const regionByCity = new Map(
  Object.entries(citiesByRegion).flatMap(([region, names]) =>
    names.map((name) => [name, region] as const),
  ),
);
const initial = ["北京", "上海", "广州", "深圳", "杭州", "南京"];
const cities = [...new Set([...initial, ...regionByCity.keys()])];
const series: HysChartSeries[] = cities.map((city, index) => ({
  id: city,
  name: city + "配送中心",
  legendGroup: regionByCity.get(city),
  legendLabel: city,
  dashed: Math.floor(index / 6) % 2 === 1,
  data: Array.from({ length: 60 }, (_, day) => {
    const time = Date.UTC(2026, 8, 1 + day);
    return {
      time,
      label: new Date(time).toISOString().slice(0, 10),
      value: 45 + index * 2 + (((day + 3) * (index * 11 + 17)) % 39),
    };
  }),
}));
const options: { value: HysChartLegendLayout; label: string; hint: string }[] =
  [
    {
      value: "compact",
      label: "紧凑平铺",
      hint: "最多铺两行，其他图例可在「更多图例」中搜索。",
    },
    {
      value: "selected",
      label: "已选优先",
      hint: "显示已启用系列，点击图例可移除，也可从「选择系列」添加。",
    },
    {
      value: "grouped",
      label: "按地区分组",
      hint: "切换地区可查看该组的图例，各组的曲线开关独立保留。",
    },
    {
      value: "sidebar",
      label: "右侧列表",
      hint: "列表显示最新值，窄屏下移到图表下方。",
    },
    {
      value: "paged",
      label: "单行分页",
      hint: "用箭头浏览全部图例，翻页后已显示的曲线会保留。",
    },
  ];
const layout = ref<HysChartLegendLayout>("compact");
const hidden = ref<readonly string[]>(
  cities.filter((city) => !initial.includes(city)),
);
const hint = computed(
  () => options.find((option) => option.value === layout.value)?.hint,
);
const chart = useTemplateRef<InstanceType<typeof HysChart>>("chart");
const range = ref<HysChartRange | null>(null);
const cursor = ref<HysChartCursor | null>(null);
const rangePresets: HysChartRangePreset[] = [
  { label: "近 7 天", days: 7 },
  { label: "近 30 天", days: 30 },
  { label: "全部" },
];
const exportChoices: {
  label: string;
  format: HysChartExportFormat;
  all?: boolean;
}[] = [
  { label: "当前图表 · PNG", format: "png" },
  { label: "当前图表 · SVG", format: "svg" },
  { label: "当前区间和可见系列 · CSV", format: "csv" },
  { label: "全部原始数据 · CSV", format: "csv", all: true },
];
const exportMessage = ref("");
const exporting = ref(false);
async function save(choice: (typeof exportChoices)[number]) {
  if (!chart.value || exporting.value) return;
  exporting.value = true;
  exportMessage.value = "正在准备下载…";
  try {
    const suffix = choice.all ? "全部数据" : "当前视图";
    await chart.value.download(
      choice.format,
      "配送中心日订单量-" + suffix + "." + choice.format,
      {
        scope: choice.all ? "all" : "visible",
        includeContext: true,
      },
    );
    exportMessage.value = "已生成 " + choice.format.toUpperCase() + " 下载";
  } catch (error) {
    exportMessage.value =
      error instanceof Error ? error.message : "图表导出失败";
  } finally {
    exporting.value = false;
  }
}
</script>

<template>
  <div class="demo-stack chart-legend-demo">
    <div class="chart-legend-demo-controls">
      <span class="chart-legend-label">图例布局</span>
      <HysSelect
        v-model="layout"
        :options="options"
        size="sm"
        aria-label="图例布局"
        class="chart-legend-layout"
      />
      <output class="chart-legend-count"
        >{{ series.length - hidden.length }} /
        {{ series.length }} 个系列可见</output
      >
      <div class="chart-export">
        <HysPopover
          trigger="click"
          placement="bottom-end"
          :width="224"
          max-width="calc(100vw - 20px)"
          aria-label="导出图表"
        >
          <template #trigger
            ><HysButton size="sm" variant="secondary" :loading="exporting"
              >导出</HysButton
            ></template
          >
          <template #default="{ close }">
            <div class="chart-export-options">
              <HysButton
                v-for="choice in exportChoices"
                :key="choice.label"
                size="sm"
                variant="ghost"
                @click="
                  close();
                  save(choice);
                "
                >{{ choice.label }}</HysButton
              >
            </div>
          </template>
        </HysPopover>
      </div>
    </div>
    <HysChart
      ref="chart"
      v-model:hidden-keys="hidden"
      v-model:range="range"
      v-model:cursor="cursor"
      :legend-layout="layout"
      type="line"
      :series="series"
      aria-label="各配送中心日订单量"
      :height="250"
      :x-axis="{ type: 'time' }"
      :y-axis="{ unit: '单' }"
      :range-presets="rangePresets"
      :sampling="36"
      show-date-range
      legend-actions
      crosshair
      tooltip-interactive
      zoomable
    >
      <template #title>配送中心日订单量</template>
    </HysChart>
    <p class="scenario-note">
      {{ hint }} 点击绘图区可锁定当日对比，触屏也可直接点选。
      可使用方向键浏览，Enter 锁定，Esc 清除。
    </p>
    <p v-if="exportMessage" class="scenario-note" role="status">
      {{ exportMessage }}
    </p>
  </div>
</template>

<style scoped>
.chart-legend-demo {
  container-type: inline-size;
}
.chart-legend-demo-controls {
  display: grid;
  grid-template-columns: max-content minmax(0, 140px) minmax(
      max-content,
      1fr
    ) max-content;
  align-items: center;
  gap: 6px 10px;
}
.chart-legend-label,
.chart-legend-layout {
  font-size: 13px;
  min-inline-size: 0;
}
.chart-export {
  justify-self: end;
}
@container (max-width: 380px) {
  .chart-legend-demo-controls {
    grid-template-columns: 1fr 1fr;
  }
  .chart-legend-layout {
    inline-size: 100%;
  }
}
.chart-legend-demo-controls output.chart-legend-count {
  display: inline-flex;
  align-items: center;
  justify-self: start;
  width: auto;
  min-height: var(--hys-ui-control-height-sm, 30px);
  margin: 0;
  padding: 0 8px;
  line-height: 1.2;
  color: var(--hys-ui-theme-muted);
  font-variant-numeric: tabular-nums;
  font-size: 12px;
}
.chart-export-options {
  display: grid;
  gap: 2px;
}
.chart-export-options :deep(.hys-ui-button) {
  justify-content: flex-start;
  text-align: start;
}
</style>
