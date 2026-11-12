<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysNumberInput,
  HysSelect,
  useHysToast,
  type HysToastAnimation,
  type HysToastDirection,
} from "hys-ui";

const animation = ref<HysToastAnimation | "custom">("slide"),
  direction = ref<HysToastDirection>("top"),
  duration = ref(280),
  easing = ref("preset"),
  result = ref("");
const toast = useHysToast({ position: "top-center", duration: 0 });
const motions = [
  ["淡入淡出", "fade"],
  ["滑动", "slide"],
  ["缩放", "scale"],
  ["弹性", "spring"],
  ["弹跳", "bounce"],
  ["旋转", "rotate"],
  ["自定义", "custom"],
  ["关闭动画", "none"],
].map(([label, value]) => ({ label, value }));
const directions = [
  ["上方", "top"],
  ["下方", "bottom"],
  ["左侧", "left"],
  ["右侧", "right"],
].map(([label, value]) => ({ label, value }));
const easings = [
  { label: "跟随预设", value: "preset" },
  { label: "线性", value: "linear" },
  { label: "自定义贝塞尔", value: "cubic-bezier(.24,.8,.2,1)" },
  { label: "自定义缓动函数", value: "function" },
];
function show() {
  toast.closeAll();
  toast.show({
    title: "动画预览",
    message: "关闭提示可查看退场动画。",
    type: "default",
    swipe: true,
    animation:
      animation.value === "custom"
        ? {
            enterFrom: "translateX(24px) rotate(4deg)",
            leaveTo: "translateY(18px) scale(.9)",
            opacity: 0,
          }
        : animation.value,
    direction: direction.value,
    animationDuration: duration.value,
    easing:
      easing.value === "function"
        ? (progress) => 1 - (1 - progress) ** 3
        : easing.value === "preset"
          ? undefined
          : easing.value,
    onAfterShow: () => {
      result.value = "入场完成";
    },
    onAfterClose: () => {
      result.value = "退场完成";
    },
  });
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >动画效果<HysSelect
            v-model="animation"
            :options="motions"
            aria-label="动画效果"
        /></label>
        <label class="demo-field"
          >滑动来源<HysSelect
            v-model="direction"
            :options="directions"
            aria-label="滑动来源"
        /></label>
        <label class="demo-field"
          >时长（毫秒）<HysNumberInput
            v-model="duration"
            :min="0"
            :max="1500"
            :step="40"
            aria-label="动画时长"
        /></label>
        <label class="demo-field"
          >缓动曲线<HysSelect
            v-model="easing"
            :options="easings"
            aria-label="缓动曲线"
        /></label>
      </div>
    </div>
    <div class="demo-control-actions">
      <HysButton @click="show">播放动画</HysButton>
    </div>
    <output class="state-output">{{
      result || "系统开启减少动态效果时，提示会直接显示或关闭。"
    }}</output>
  </div>
</template>
