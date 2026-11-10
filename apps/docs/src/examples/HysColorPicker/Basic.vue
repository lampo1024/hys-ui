<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker } from "hys-ui";
const color = ref("#3867f5");
</script>
<template>
  <div class="demo-stack">
    <HysColorPicker v-model="color" label="品牌色" /><output
      class="state-output"
      >{{ color }}</output
    >
    <p class="scenario-note">
      默认即时更新，使用自定义色板、色相轨道和文本输入。方向键微调，Shift 加速。
    </p>
  </div>
</template>
