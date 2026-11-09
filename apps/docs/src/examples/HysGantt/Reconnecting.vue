<script setup lang="ts">
import { ref } from "vue";
import {
  HysGantt,
  HysButton,
  type GanttItem,
  type HysGanttInstance,
} from "hys-ui";
const gantt = ref<HysGanttInstance>(),
  lastEvent = ref("尚未修改终点");
function day(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
const items = ref<GanttItem[]>([
  {
    id: "parent",
    title: "前期准备",
    start: day(-5),
    end: day(-3),
    progress: 100,
  },
  {
    id: "source",
    title: "接口开发 · 前置任务",
    start: day(0),
    end: day(4),
    progress: 60,
    dependencies: ["parent"],
  },
  {
    id: "first",
    title: "原后置任务 · 联调验证",
    start: day(5),
    end: day(8),
    progress: 20,
    dependencies: ["source"],
  },
  {
    id: "second",
    title: "备选后置任务 · 集成验收",
    start: day(6),
    end: day(10),
    progress: 0,
  },
  {
    id: "locked",
    title: "归档记录 · 禁止编辑",
    start: day(10),
    end: day(12),
    disabled: true,
  },
]);
</script>
<template>
  <div class="demo-content">
    <div class="demo-control-actions">
      <HysButton
        :disabled="!items[2].dependencies?.includes('source')"
        @click="gantt?.moveDependency('source', 'first', 'second')"
        >改接到备选任务</HysButton
      >
      <HysButton
        variant="secondary"
        :disabled="!items[3].dependencies?.includes('source')"
        @click="gantt?.moveDependency('source', 'second', 'first')"
        >还原原终点</HysButton
      >
    </div>
    <HysGantt
      ref="gantt"
      v-model:items="items"
      :height="340"
      :row-height="48"
      :label-width="220"
      editable
      @dependency-move="
        (info) =>
          (lastEvent =
            '已改接：' + info.previousTargetId + ' → ' + info.targetId)
      "
      @dependency-invalid="(info) => (lastEvent = JSON.stringify(info))"
    />
    <output>{{ lastEvent }}</output>
    <p class="hint">
      悬停或选中已有连线，拖动箭头附近的空心圆到新的任务即可修改终点；也可聚焦终点后按
      Enter，用上下键选择，再按 Enter
      确认。拖动期间原连接保留，Esc、无效目标或松开在图表外都会保留原关系。接口开发不能依赖自身，也不能改接回前期准备形成循环。
    </p>
  </div>
</template>
