<script setup lang="ts">
import { computed, ref } from "vue";
import { HysButton, HysSteps, type HysStepItem } from "hys-ui";

const current = ref(1);
const progress = ref(40);
const items = computed<HysStepItem[]>(() => [
  { title: "准备文件" },
  { title: "导入订单", progress: progress.value },
  { title: "复核数据" },
]);
function advance() {
  progress.value = Math.min(100, progress.value + 20);
  if (progress.value === 100) current.value = 2;
}
</script>

<template>
  <div class="demo-stack">
    <HysSteps
      v-model:current="current"
      :items="items"
      aria-label="订单导入流程"
      clickable
      linear
    />
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="progress === 100"
        @click="advance"
        >推进导入</HysButton
      >
    </div>
  </div>
</template>
