<script setup lang="ts">
import { ref } from "vue";
import { HysSlider } from "hys-ui";
const value = ref(25),
  plain = ref(50);
const marks = {
  0: "关闭",
  25: "低",
  60: "中",
  100: { label: "高", style: { color: "#e77614" } },
};
</script>
<template>
  <div class="demo-content">
    <HysSlider
      v-model="value"
      label="仅选择刻度"
      step="mark"
      :marks="marks"
      show-stops
    />
    <HysSlider
      v-model="plain"
      label="独立位置"
      :included="false"
      :step="10"
      :marks="{ 0: '0', 50: '50', 100: '100' }"
      show-stops
    />
    <output class="state-output"
      >刻度选择：{{ value }}；独立位置：{{ plain }}</output
    >
    <p class="scenario-note">
      step="mark" 或 step=null 只允许选择 marks
      中的值。刻度文字可点击，方向键按刻度顺序定位。
    </p>
  </div>
</template>
