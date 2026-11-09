<script setup lang="ts">
import { ref } from "vue";
import {
  HysGantt,
  HysCheckbox,
  HysButton,
  type GanttItem,
  type HysGanttInstance,
} from "hys-ui";
const gantt = ref<HysGanttInstance>(),
  show = ref(true);
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
  { id: "design", title: "需求设计", start: day(0), end: day(4), progress: 80 },
  {
    id: "build",
    title: "接口开发 · 开始过早",
    start: day(3),
    end: day(6),
    dependencies: ["design"],
  },
  {
    id: "review",
    title: "验收检查 · 前置已失效",
    start: day(8),
    end: day(10),
    dependencies: ["removed"],
  },
  {
    id: "invalid",
    title: "日期格式错误的任务",
    start: "2026-02-30",
    end: day(4),
  },
  {
    id: "cycle-a",
    title: "循环任务 A",
    start: day(5),
    end: day(7),
    dependencies: ["cycle-b"],
  },
  {
    id: "cycle-b",
    title: "循环任务 B",
    start: day(5),
    end: day(7),
    dependencies: ["cycle-a"],
  },
]);
function fix() {
  items.value = items.value.map((item) =>
    item.id === "build"
      ? { ...item, start: day(5) }
      : item.id === "review"
        ? { ...item, dependencies: ["build"] }
        : item.id === "invalid"
          ? { ...item, start: day(7), end: day(7) }
          : item.id === "cycle-a"
            ? { ...item, dependencies: [] }
            : item.id === "cycle-b"
              ? { ...item, start: day(8), end: day(9) }
              : item,
  );
}
</script>
<template>
  <div class="demo-content">
    <div class="demo-control-actions">
      <HysCheckbox v-model="show" label="显示冲突提示" /><HysButton
        variant="secondary"
        @click="fix"
        >修正示例数据</HysButton
      >
    </div>
    <HysGantt
      ref="gantt"
      v-model:items="items"
      :height="350"
      :row-height="48"
      :label-width="230"
      editable
      :show-conflicts="show"
    />
    <output
      >检测到
      {{
        gantt?.conflicts.length ?? 0
      }}
      项冲突。提示只检查数据，不会自动移动任务。</output
    >
    <p class="hint">
      点击“查看详情”可搜索和定位冲突，列表按页展示。任务日期按整天计算，后置任务需在前置任务结束的次日或之后开始。外部数据中的日期错误、失效引用、循环关系也会检查；日期无效的任务会隐藏于时间轴，但保留诊断信息。
    </p>
  </div>
</template>
