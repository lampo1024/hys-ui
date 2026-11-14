<script setup lang="ts">
import { ref } from "vue";
import { HysChart, HysCheckbox } from "hys-ui";
const show = ref(true);
const data = [
  { label: "周一", value: 68 },
  { label: "周二", value: 82 },
  { label: "周三", value: 75 },
  { label: "周四", value: 92 },
];
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="show" label="显示目标线" />
    <HysChart
      :data="data"
      type="line"
      :height="150"
      :reference="show ? { value: 80, label: '目标 80 单' } : undefined"
    >
      <template #title>每日完成订单</template>
    </HysChart>
  </div>
</template>
