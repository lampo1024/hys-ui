<script setup lang="ts">
import { ref } from "vue";
import {
  HysTimeline,
  HysSelect,
  HysCheckbox,
  HysSlider,
  type HysTimelineItem,
  type HysTimelineMode,
} from "hys-ui";
const mode = ref<HysTimelineMode>("alternate"),
  responsive = ref(true),
  width = ref(720);
const items: HysTimelineItem[] = [
  {
    id: 0,
    title: "需求已确认",
    label: "2026-11-10",
    description: "确认目标与验收条件。",
    status: "done",
  },
  {
    id: 1,
    title: "方案已完成",
    label: "2026-11-11",
    description: "准备进入实现阶段。",
    status: "current",
  },
  {
    id: 2,
    title: "指定在左侧展示",
    label: "2026-11-12",
    position: "left",
    description: "单项位置优先于整体布局。",
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="demo-field"
        >时间线布局<HysSelect
          v-model="mode"
          :options="
            ['left', 'right', 'alternate', 'alternate-reverse'].map(
              (value) => ({ label: value, value }),
            )
          " /></label
      ><HysCheckbox v-model="responsive" label="窄容器自动调整" />
    </div>
    <HysSlider
      v-model="width"
      :min="260"
      :max="900"
      :step="20"
      aria-label="时间线容器宽度"
    />
    <div :style="{ width: width + 'px', maxWidth: '100%' }">
      <HysTimeline
        :items="items"
        :mode="mode"
        :responsive="responsive"
        aria-label="响应式时间线"
      />
    </div>
    <p class="scenario-note">
      left / right 指轴线在对应侧；交错模式按条目分配左右内容。独立 label 或单项
      position 使用居中轴。容器不超过 480px 时，可自动改为单侧排版。
    </p>
  </div>
</template>
