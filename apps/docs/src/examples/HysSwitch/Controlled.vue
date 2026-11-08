<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysSwitch, HysCheckbox } from "hys-ui";
const value = ref(false),
  allow = ref(false),
  request = ref("");
function update(next: boolean) {
  request.value = String(next);
  if (allow.value) value.value = next;
}
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="allow" label="允许更新状态" /><HysSwitch
      :model-value="value"
      aria-label="受控开关"
      active-text="已开启"
      inactive-text="已关闭"
      @update:model-value="update"
    /><output>请求：{{ request || "无" }} · 实际值：{{ value }}</output>
  </div>
</template>
