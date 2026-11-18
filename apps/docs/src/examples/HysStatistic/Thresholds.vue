<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysStatistic } from "hys-ui";
const rate = ref(0.93);
</script>

<template>
  <div class="demo-stack">
    <HysStatistic title="准时交付率" :value="rate" number-format="percent" :target="0.96"
      :thresholds="{ low: 0.94, high: 0.99 }" :comparison-value="0.89" comparison-label="同比"
      help="按准时完成的订单数除以已完成订单数计算。" animated highlight-changes />
    <div class="demo-row">
      <HysButton size="sm" variant="secondary" @click="rate = .93">更新为 93%</HysButton>
      <HysButton size="sm" variant="secondary" @click="rate = .99">更新为 99%</HysButton>
    </div>
  </div>
</template>
