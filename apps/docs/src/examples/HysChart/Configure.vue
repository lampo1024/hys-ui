<script setup lang="ts">
import { ref } from "vue";
import {
  HysChart,
  HysCheckbox,
  HysSelect,
  type HysChartBarStyle,
  type HysChartType,
} from "hys-ui";

const type = ref<HysChartType>("bar");
const barStyle = ref<HysChartBarStyle>("gradient");
const labels = ref(true);
const data = [
  { label: "搜索", value: 128 },
  { label: "直接访问", value: 96 },
  { label: "应用内推荐", value: 73 },
  { label: "邮件", value: 42 },
  { label: "合作伙伴", value: 26 },
];
const types = [
  { value: "bar", label: "柱状" },
  { value: "horizontal-bar", label: "横向条形" },
  { value: "line", label: "折线" },
  { value: "area", label: "面积" },
];
const styles = [
  { value: "solid", label: "实心" },
  { value: "gradient", label: "渐变" },
  { value: "outline", label: "描边" },
];
</script>

<template>
  <div class="demo-stack">
    <HysChart
      :data="data"
      :type="type"
      :bar-style="barStyle"
      :show-values="labels"
      :height="255"
      smooth
    >
      <template #title>渠道带来的新增客户</template>
    </HysChart>
    <div class="demo-row">
      <HysSelect
        v-model="type"
        :options="types"
        aria-label="访问渠道图表类型"
        style="width: 140px"
      />
      <HysSelect
        v-if="type === 'bar' || type === 'horizontal-bar'"
        v-model="barStyle"
        :options="styles"
        aria-label="柱体样式"
        style="width: 140px"
      />
      <HysCheckbox v-model="labels" label="显示数值" />
    </div>
  </div>
</template>
