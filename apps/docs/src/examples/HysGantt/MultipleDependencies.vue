<script setup lang="ts">
import { ref, computed } from "vue";
import { HysGantt, type GanttItem } from "hys-ui";
const lastEvent = ref("可点击汇入终点或数字标记，选择一条前置关系");
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
    id: "planning",
    title: "需求确认",
    start: day(0),
    end: day(3),
    progress: 25,
  },
  {
    id: "frontend",
    title: "页面实现",
    start: day(1),
    end: day(5),
    progress: 50,
  },
  {
    id: "backend",
    title: "接口实现",
    start: day(2),
    end: day(7),
    progress: 75,
  },
  {
    id: "release",
    title: "集成发布",
    start: day(3),
    end: day(10),
    progress: 100,
    dependencies: ["planning", "frontend", "backend"],
  },
  {
    id: "alternative",
    title: "备选验收",
    start: day(6),
    end: day(11),
    progress: 0,
  },
]);
const title = (id: string | number) =>
  items.value.find((item) => item.id === id)?.title ?? String(id);
const predecessors = computed(
  () =>
    items.value
      .find((item) => item.id === "release")
      ?.dependencies?.map(title)
      .join("、") || "无",
);
</script>
<template>
  <div class="demo-content">
    <HysGantt
      v-model:items="items"
      :height="360"
      :row-height="52"
      :label-width="200"
      editable
      @dependency-move="
        (info) =>
          (lastEvent =
            '已改接 ' +
            title(info.sourceId) +
            '：' +
            title(info.previousTargetId) +
            ' → ' +
            title(info.targetId))
      "
    />
    <output>集成发布的前置：{{ predecessors }}<br />{{ lastEvent }}</output>
    <p class="hint">
      多条关系共享终点时，点击汇入端或数字标记会显示前置任务列表。选中一条后仅该线的终点可拖动，其余连线会淡化。底部显示完整的前置任务与后置任务名称。可将指定关系改接到“备选验收”，其余关系保持不变。
    </p>
  </div>
</template>
