<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker } from "hys-ui";
const color = ref("rgba(239, 68, 68, 0.5)"),
  presets = [
    "#3867f5",
    "rgb(34, 160, 107)",
    "hsl(280, 60%, 60%)",
    "hsva(30, 80%, 95%, 0.7)",
    "transparent",
    "#ef444480",
    "#fff",
    "#000",
  ];
</script>
<template>
  <div class="demo-stack">
    <HysColorPicker
      v-model="color"
      :presets="presets"
      show-alpha
      label="预设颜色"
    /><output class="state-output">{{ color }}</output>
    <p class="scenario-note">
      预设支持不同格式和透明色，无效值会跳过。选中标记使用可读的对比色。
    </p>
  </div>
</template>
