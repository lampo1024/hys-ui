<script setup lang="ts">
import { HysPopover, HysButton, type HysPopupPlacement } from "hys-ui";
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
      <HysPopover
        v-for="place in placements"
        :key="place"
        :placement="place"
        :title="place"
        content="显示位置会根据可用空间调整。"
        show-arrow
        ><template #trigger
          ><HysButton variant="secondary">{{ place }}</HysButton></template
        ></HysPopover
      >
    </div>
    <p class="scenario-note">
      支持十二种位置、边界翻转与箭头定位。滚动和尺寸变化时会更新位置。
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
