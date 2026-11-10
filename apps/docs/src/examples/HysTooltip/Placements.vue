<script setup lang="ts">
import { HysTooltip, HysButton, type HysPopupPlacement } from "hys-ui";
const placements: HysPopupPlacement[] = [
  "top-start",
  "top",
  "top-end",
  "right-start",
  "right",
  "right-end",
  "bottom-end",
  "bottom",
  "bottom-start",
  "left-end",
  "left",
  "left-start",
];
</script>
<template>
  <div class="demo-stack">
    <div class="placement-grid">
      <HysTooltip
        v-for="place in placements"
        :key="place"
        :placement="place"
        :text="place + ' 提示位置'"
        show-arrow
        ><HysButton variant="secondary">{{ place }}</HysButton></HysTooltip
      >
    </div>
    <p class="scenario-note">
      内容接近视口边缘时自动翻转，并将箭头对准触发区域；可使用
      autoAdjustOverflow 关闭自动翻转。
    </p>
  </div>
</template>
<style scoped>
.placement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(145px, 1fr));
  gap: 14px;
  padding: 16px 0;
}
</style>
