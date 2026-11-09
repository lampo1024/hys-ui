<script setup lang="ts">
import { ref } from "vue";
import { HysGantt, type GanttItem } from "hys-ui";
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
  { id: "source", title: "前置任务", start: day(0), end: day(2), progress: 70 },
  {
    id: "target",
    title: "后置任务 · 可向左拖动",
    start: day(3),
    end: day(6),
    progress: 20,
    dependencies: ["source"],
  },
]);
</script>
<template>
  <div class="demo-content">
    <HysGantt
      v-model:items="items"
      :row-height="56"
      :label-width="220"
      editable
    />
    <p class="hint">
      将后置任务向左拖动一天，会预览新增的前后置日期冲突；也可延长前置任务的结束日期。松开后保留你的修改并显示警告，点击撤销即可恢复。拖动预览仅检查相关依赖，Esc
      或 Ctrl / ⌘ + Z 可取消尚未提交的拖动。
    </p>
  </div>
</template>
