<script setup lang="ts">
import { ref } from "vue";
import { HysGantt, HysNumberInput, type GanttItem } from "hys-ui";
const rowHeight = ref(60),
  selected = ref<string | number | null>("a-target");
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
    id: "a-source",
    title: "前置任务 A",
    start: day(0),
    end: day(5),
    progress: 80,
  },
  {
    id: "a-target",
    title: "后置任务 A · 向下折返",
    start: day(-3),
    end: day(8),
    progress: 30,
    dependencies: ["a-source"],
  },
  {
    id: "b-target",
    title: "后置任务 B · 向上折返",
    start: day(-2),
    end: day(6),
    progress: 40,
    dependencies: ["b-source"],
  },
  {
    id: "b-source",
    title: "前置任务 B",
    start: day(1),
    end: day(7),
    progress: 60,
  },
]);
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <label class="demo-field"
        ><span>任务行高</span
        ><HysNumberInput
          v-model="rowHeight"
          :min="40"
          :max="80"
          :step="4"
          aria-label="折返示例任务行高"
      /></label>
    </div>
    <HysGantt
      v-model:items="items"
      v-model="selected"
      :row-height="rowHeight"
      :label-width="210"
      editable
    />
    <p class="hint">
      当后置任务的开始时间早于前置任务的结束时间时，连线沿任务行之间的空隙折返，从目标左侧进入，并保留可见的短线段。上下两个方向均适用。可拖动任务条观察连线变化；依赖关系保留原排期，不会自动推迟任务。
    </p>
  </div>
</template>
