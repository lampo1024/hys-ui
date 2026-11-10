<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTour,
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
const open = ref(false);
const steps = [
  { title: "欢迎", description: "通过本次引导了解常用操作。" },
  { title: "开始使用", description: "你已准备好探索各项功能。" },
];
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
      <HysButton @click="open = true">开始引导</HysButton
      ><HysTour v-model="open" :steps="steps" v-bind="motion" />
    </div>
    <p class="scenario-note">
      引导复用弹窗的焦点管理和进入/退出动画。全局关闭动效或系统开启减少动态效果时，自动禁用动画；时长设为
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
