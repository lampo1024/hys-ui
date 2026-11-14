<script setup lang="ts">
import { ref } from "vue";
import { HysChart, HysCheckbox } from "hys-ui";
const table = ref(false);
const data = [
  { label: "一月", value: -12 },
  { label: "二月", value: 15 },
  { label: "三月", value: 27 },
  { label: "四月", value: 9 },
];
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="table" label="显示数据表" />
    <HysChart
      :data="data"
      :height="160"
      :show-table="table"
      :value-formatter="(value) => value + ' 万元'"
      show-values
    >
      <template #title>月度净现金流</template>
    </HysChart>
  </div>
</template>
