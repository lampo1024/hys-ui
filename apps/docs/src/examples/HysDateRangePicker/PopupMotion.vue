<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysDateRangePicker,
  HysSelect,
  HysNumberInput,
  HysButton,
  type HysPopupTransition,
} from "hys-ui";
const effect = ref<HysPopupTransition>("scale"),
  duration = ref(160);
const effects = [
  { label: "柔和缩放", value: "scale" },
  { label: "淡入淡出", value: "fade" },
  { label: "轻移", value: "slide" },
  { label: "轻移缩放", value: "slide-fade" },
  { label: "无动画", value: "none" },
];
const motion = computed(() => ({
  popupTransition: effect.value,
  popupTransitionDuration: duration.value,
}));
const value = ref<[string, string]>(["2026-11-02", "2026-11-20"]);
</script>
<template>
  <div class="demo-stack popup-motion-demo">
    <div class="popup-motion-controls">
      <label
        ><span>浮层动效</span
        ><HysSelect
          v-model="effect"
          :options="effects"
          aria-label="浮层动效" /></label
      ><label
        ><span>时长（毫秒）</span
        ><HysNumberInput
          v-model="duration"
          :min="0"
          :max="1000"
          :step="40"
          aria-label="浮层动效时长"
      /></label>
    </div>
    <div class="demo-content">
      <HysDateRangePicker v-model="value" v-bind="motion" clearable />
    </div>
    <p class="scenario-note">
      展开和收起使用同一配置；关闭动画期间浮层停止接收点击和键盘操作。全局关闭动效或系统开启减少动态效果时，自动禁用动画；时长设为
      0 也可立即切换。
    </p>
  </div>
</template>
<style scoped>
.popup-motion-controls {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 240px));
  gap: 16px;
  padding: 20px;
  border: 1px solid var(--docs-border, var(--hys-ui-border, #dce3ee));
  border-radius: 10px;
  background: var(--docs-bg, var(--hys-ui-surface-alt, #f7f9fd));
}
.popup-motion-controls label {
  display: grid;
  gap: 8px;
  min-width: 0;
}
.popup-motion-controls label > span {
  font-size: 13px;
  color: var(--docs-muted, var(--hys-ui-muted, #74829b));
}
.popup-demo-target {
  padding: 24px;
  border: 1px dashed var(--docs-border, var(--hys-ui-border, #dce3ee));
  border-radius: 8px;
  text-align: center;
}
@media (max-width: 540px) {
  .popup-motion-controls {
    grid-template-columns: minmax(0, 1fr);
  }
}
</style>
