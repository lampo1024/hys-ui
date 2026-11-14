<script setup lang="ts">
import { ref } from "vue";
import { HysChart, HysCheckbox } from "hys-ui";

const donut = ref(true);
const data = [
  { label: "设备", value: 64 },
  { label: "服务", value: 28 },
  { label: "运输", value: 16 },
  { label: "备件", value: 12 },
];
</script>

<template>
  <div class="demo-stack">
    <HysChart
      :data="data"
      :type="donut ? 'donut' : 'pie'"
      :height="238"
      show-values
      :value-formatter="(value) => value + ' 万元'"
    >
      <template #title>采购预算构成</template>
      <template #center><strong>采购项</strong></template>
    </HysChart>
    <div class="demo-row"><HysCheckbox v-model="donut" label="环形显示" /></div>
  </div>
</template>
