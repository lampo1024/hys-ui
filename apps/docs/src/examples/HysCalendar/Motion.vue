<script setup lang="ts">
import { ref } from "vue";
import {
  HysCalendar,
  HysSelect,
  HysNumberInput,
  type HysCalendarTransition,
} from "hys-ui";
const value = ref("2026-11-09"),
  transition = ref<HysCalendarTransition>("slide"),
  duration = ref(220);
const options = [
  { label: "横向滑动", value: "slide" },
  { label: "淡入淡出", value: "fade" },
  { label: "纵向滑动", value: "slide-up" },
  { label: "轻微缩放", value: "zoom" },
  { label: "关闭动画", value: "none" },
];
</script>
<template>
  <div>
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>切换动效</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            >动画样式<HysSelect
              v-model="transition"
              :options="options"
              aria-label="日历切换动画" /></label
          ><label class="demo-field"
            >动画时长（毫秒）<HysNumberInput
              v-model="duration"
              :min="0"
              :max="800"
              :step="20"
              aria-label="日历动画时长"
          /></label>
        </div>
      </section>
    </div>
    <div class="demo-content">
      <HysCalendar
        v-model="value"
        :transition="transition"
        :transition-duration="duration"
        fixed-weeks
      />
    </div>
    <p class="scenario-note">
      点击日历头部的前后月份按钮体验动画。滑动方向随前后月份改变；动画仅使用透明度与变换，不逐帧计算日期布局。六周固定布局可保持容器高度一致。减少动态效果或全局动效关闭时直接切换。
    </p>
  </div>
</template>
