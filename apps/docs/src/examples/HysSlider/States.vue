<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysSlider } from "hys-ui";
const disabled = ref(true),
  value = ref(40);
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="disabled" label="禁用滑块" /><HysSlider
      v-model="value"
      label="可切换禁用"
      :disabled="disabled"
      show-input
    /><HysSlider :model-value="65" label="只读" readonly /><HysSlider
      :model-value="20"
      label="错误提示"
      error="请将数值调整到 50 以上"
    /><HysSlider
      :model-value="10"
      :min="10"
      :max="10"
      label="无可调整范围"
    /><HysSlider :model-value="0" step="mark" label="没有可选刻度" />
    <p class="scenario-note">
      禁用和只读状态不会响应拖动。无有效范围或仅刻度模式下没有刻度时自动禁用。
    </p>
  </div>
</template>
