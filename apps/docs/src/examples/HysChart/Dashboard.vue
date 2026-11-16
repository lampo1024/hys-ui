<script setup lang="ts">
import { computed, ref, useTemplateRef, watch } from "vue";
import {
  HysButton,
  HysChart,
  HysCheckbox,
  HysDataGrid,
  type GridColumn,
  type HysDataGridQuery,
  type HysChartAnnotation,
  type HysChartExportFormat,
  type HysChartRange,
  type HysChartXAxis,
} from "hys-ui";

const start = Date.UTC(2026, 10, 12, 8);
const clock = new Intl.DateTimeFormat("zh-CN", {
  timeZone: "UTC",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const rows = Array.from({ length: 240 }, (_, index) => {
  const time = start + index * 60000;
  return {
    id: String(index + 1),
    time,
    label: clock.format(time),
    requests:
      760 + Math.round((Math.sin(index / 12) + 1) * 170) + ((index * 17) % 120),
    latency:
      index >= 78 && index <= 86
        ? null
        : 160 +
          Math.round((Math.sin(index / 9) + 1) * 50) +
          ((index * 31) % 42),
  };
});
const columns: GridColumn[] = [
  {
    key: "label",
    label: "时间 UTC",
    width: 120,
    sortable: false,
    filterable: false,
  },
  {
    key: "requests",
    label: "请求量",
    width: 110,
    sortable: false,
    filterable: false,
  },
  {
    key: "latency",
    label: "延迟 ms",
    width: 110,
    sortable: false,
    filterable: false,
  },
];
const timeAxis: HysChartXAxis = {
  type: "time",
  tickCount: 6,
  formatter: (time) => clock.format(time),
};
const main = [
  {
    id: "requests",
    name: "请求量",
    data: rows.map((row) => ({
      id: row.id,
      label: row.label,
      time: row.time,
      value: row.requests,
    })),
  },
  {
    id: "latency",
    name: "响应延迟",
    yAxis: 1 as const,
    data: rows.map((row) => ({
      id: row.id,
      label: row.label,
      time: row.time,
      value: row.latency,
    })),
  },
];
const annotations: HysChartAnnotation[] = [
  {
    type: "band",
    from: 250,
    to: 300,
    yAxis: 1,
    label: "延迟警戒区",
    color: "var(--hys-ui-theme-orange)",
  },
  { type: "max", seriesId: "requests" },
  { type: "trend", seriesId: "requests" },
];
const selection = ref<string | null>(null);
const hiddenKeys = ref<readonly string[]>([]);
const range = ref<HysChartRange | null>(null);
const sample = ref(true);
const status = ref("");
const query = ref<HysDataGridQuery>({
  page: 1,
  pageSize: 5,
  sort: [],
  filters: {},
  search: "",
});
const chart = useTemplateRef("chart");
const tableRows = computed(() =>
  rows.filter(
    (row) =>
      !range.value ||
      (row.time >= range.value.start && row.time <= range.value.end),
  ),
);
const currentRowKey = computed(
  () => selection.value?.slice(selection.value.lastIndexOf(":") + 1) ?? null,
);
const overviewKey = computed(() =>
  currentRowKey.value === null ? null : "requests:" + currentRowKey.value,
);
watch([currentRowKey, tableRows], ([key, visible]) => {
  const index = visible.findIndex((row) => row.id === key);
  if (index >= 0)
    query.value = {
      ...query.value,
      page: Math.floor(index / query.value.pageSize) + 1,
    };
});
function setRow(key: string | number | null) {
  selection.value = key === null ? null : "requests:" + key;
}
async function save(format: HysChartExportFormat | "copy") {
  try {
    if (format === "copy") await chart.value?.copyImage();
    else await chart.value?.download(format, "service-metrics." + format);
    status.value =
      format === "copy" ? "已复制图表图片" : "已下载 " + format.toUpperCase();
  } catch (error) {
    status.value = error instanceof Error ? error.message : String(error);
  }
}
</script>

<template>
  <div class="demo-stack">
    <p class="scenario-note">
      在 X
      轴下方的概览里拖出区间，松开后主图、联动图和明细表同步更新。拖动两端可微调，拖动选区可平移。主图内也支持滚轮缩放和
      Shift 框选。
    </p>
    <div class="demo-row chart-actions">
      <HysCheckbox v-model="sample" label="开启采样" />
      <HysButton size="sm" variant="secondary" @click="save('png')"
        >下载 PNG</HysButton
      >
      <HysButton size="sm" variant="secondary" @click="save('svg')"
        >下载 SVG</HysButton
      >
      <HysButton size="sm" variant="secondary" @click="save('csv')"
        >下载 CSV</HysButton
      >
      <HysButton size="sm" variant="secondary" @click="save('copy')"
        >复制图片</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        :disabled="!selection"
        @click="selection = null"
        >清除选中</HysButton
      >
      <output role="status">{{ status }}</output>
    </div>
    <HysChart
      ref="chart"
      v-model:range="range"
      v-model:selected-key="selection"
      v-model:hidden-keys="hiddenKeys"
      type="line"
      :series="main"
      :x-axis="timeAxis"
      :y-axis="[
        { min: 600, max: 1300, ticks: [600, 800, 1000, 1200], unit: '次' },
        { min: 0, max: 300, unit: 'ms' },
      ]"
      :annotations="annotations"
      :sampling="sample ? 90 : undefined"
      :height="260"
      zoomable
      tooltip-mode="axis"
      tooltip-interactive
      aria-label="请求量和延迟明细图"
    >
      <template #title>接口运行监控</template>
      <template #tooltip="{ item, items, close }">
        <strong>{{ item.point.label }} UTC</strong>
        <ul>
          <li v-for="metric in items" :key="metric.key">
            {{ metric.series.name }}　{{ metric.text }}
          </li>
        </ul>
        <HysButton
          size="sm"
          variant="ghost"
          @click="
            setRow(item.point.id ?? null);
            close();
          "
          >在明细中选中</HysButton
        >
      </template>
    </HysChart>
    <HysChart
      v-model:range="range"
      :series="main.slice(0, 1)"
      :selected-key="overviewKey"
      :hidden-keys="hiddenKeys"
      type="area"
      :x-axis="timeAxis"
      :sampling="sample ? 90 : undefined"
      :height="150"
      :show-legend="false"
      @point-click="(point) => setRow(point.point.id ?? null)"
      aria-label="请求量概览图"
    >
      <template #title>请求量概览</template>
    </HysChart>
    <HysDataGrid
      :current-row-key="currentRowKey"
      :rows="tableRows"
      :columns="columns"
      v-model:query="query"
      :selectable="false"
      highlight-current-row
      @update:current-row-key="setRow"
    />
  </div>
</template>

<style scoped>
.chart-actions {
  flex-wrap: wrap;
}
</style>
