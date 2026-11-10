<script setup lang="ts">
import { HysProgress, type HysProgressStatus } from "hys-ui";
const states: HysProgressStatus[] = [
  "normal",
  "active",
  "success",
  "warning",
  "error",
];
</script>
<template>
  <div class="demo-stack">
    <div v-for="status in states" :key="status" class="demo-stack">
      <span class="scenario-note">{{ status }}</span
      ><HysProgress
        :value="status === 'success' ? 100 : 65"
        :status="status"
        show-status-icon
        :aria-label="status + ' 线形状态'"
      />
    </div>
    <div class="demo-content progress-examples">
      <HysProgress
        v-for="status in states"
        :key="status"
        :value="status === 'success' ? 100 : 65"
        :status="status"
        type="circle"
        show-status-icon
        :aria-label="status + ' 环形状态'"
      />
    </div>
    <p class="scenario-note">
      状态由调用方决定，normal 的 100% 不会自动转换状态。showStatusIcon 默认为
      false，保留原有百分比展示。
    </p>
  </div>
</template>
