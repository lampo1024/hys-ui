<script setup lang="ts">
import { ref } from "vue";
import { HysChart, HysSelect, type HysChartMissing } from "hys-ui";

const status = ref<"ready" | "loading" | "error" | "empty">("ready");
const missing = ref<HysChartMissing>("gap");
const statuses = [
  { label: "有数据", value: "ready" },
  { label: "加载中", value: "loading" },
  { label: "请求失败", value: "error" },
  { label: "无数据", value: "empty" },
];
const strategies = [
  { label: "保留中断", value: "gap" },
  { label: "连接有效点", value: "connect" },
  { label: "按零绘制", value: "zero" },
];
const readings = ["08:00", "09:00", "10:00", "11:00", "12:00", "13:00"].map(
  (label, index) => ({
    label,
    value: [26, 33, null, 40, null, 32][index],
  }),
);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysSelect
        v-model="status"
        :options="statuses"
        aria-label="图表数据状态"
        style="width: 140px"
      />
      <HysSelect
        v-model="missing"
        :options="strategies"
        aria-label="缺失值处理"
        style="width: 145px"
      />
    </div>
    <HysChart
      type="line"
      :data="status === 'empty' ? [] : readings"
      :loading="status === 'loading'"
      :error="status === 'error' ? '暂时无法获取流量数据' : null"
      :missing="missing"
      :aspect-ratio="3.2"
      show-values
      @retry="status = 'ready'"
    >
      <template #title>分时访问量</template>
      <template #empty>当前时间段内暂无访问记录</template>
    </HysChart>
  </div>
</template>
