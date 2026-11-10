<script setup lang="ts">
import { ref } from "vue";
import { HysProgress, HysSlider } from "hys-ui";
const value = ref(72);
</script>
<template>
  <div class="demo-stack">
    <HysSlider v-model="value" aria-label="调整进度" /><HysProgress
      :value="value"
      aria-label="当前进度"
    /><HysProgress
      :value="85"
      color="#10b981"
      aria-label="已确认进度"
    /><HysProgress :value="35" color="#f59e0b" aria-label="待处理进度" /><output
      class="state-output"
      >当前进度 {{ value }}%</output
    >
  </div>
</template>
