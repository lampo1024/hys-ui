<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented, HysCheckbox } from "hys-ui";
const value = ref("概览"),
  allow = ref(false),
  requested = ref("");
function update(next: string) {
  requested.value = next;
  if (allow.value) value.value = next;
}
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="allow" label="允许更新选择" /><HysSegmented
      :model-value="value"
      :options="['概览', '详情', '日志']"
      @update:model-value="update"
      aria-label="受控分段"
    /><output>实际：{{ value }} · 请求：{{ requested || "无" }}</output>
  </div>
</template>
