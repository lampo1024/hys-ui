<script setup lang="ts">
import { ref } from "vue";
import {
  HysGantt,
  HysButton,
  HysCheckbox,
  HysNumberInput,
  type GanttItem,
  type HysGanttInstance,
} from "hys-ui";
const gantt = ref<HysGanttInstance>(),
  enabled = ref(true),
  keyboard = ref(true),
  controls = ref(true),
  limit = ref(50),
  last = ref("尚未执行历史恢复");
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
    id: "design",
    title: "需求确认",
    start: day(0),
    end: day(2),
    progress: 100,
  },
  {
    id: "build",
    title: "接口开发",
    start: day(3),
    end: day(5),
    progress: 50,
    dependencies: ["design"],
  },
  {
    id: "review",
    title: "联调验收",
    start: day(6),
    end: day(8),
    progress: 20,
    dependencies: ["build"],
  },
  {
    id: "release",
    title: "发布上线",
    start: day(9),
    end: day(10),
    dependencies: ["review"],
  },
]);
function externalUpdate() {
  items.value = items.value.map((item, index) =>
    index === 0 ? { ...item, end: day(1) } : item,
  );
  last.value = "宿主更新排期后，旧历史清空";
}
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>历史记录</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>保留步数</span
            ><HysNumberInput
              v-model="limit"
              :min="0"
              :max="100"
              aria-label="历史记录步数"
          /></label>
        </div>
        <div class="demo-control-actions">
          <HysCheckbox v-model="enabled" label="启用历史记录" /><HysCheckbox
            v-model="keyboard"
            label="启用历史快捷键"
          /><HysCheckbox v-model="controls" label="显示历史按钮" />
        </div>
      </section>
    </div>
    <div class="demo-control-actions">
      <HysButton
        variant="secondary"
        :disabled="items[2].dependencies?.includes('design')"
        @click="gantt?.addDependency('design', 'review')"
        >添加前置关系</HysButton
      ><HysButton
        variant="secondary"
        :disabled="!items[2].dependencies?.includes('design')"
        @click="gantt?.removeDependency('design', 'review')"
        >删除前置关系</HysButton
      ><HysButton variant="secondary" @click="gantt?.clearHistory()"
        >清空历史</HysButton
      ><HysButton variant="ghost" @click="externalUpdate"
        >模拟外部更新</HysButton
      >
    </div>
    <HysGantt
      ref="gantt"
      v-model:items="items"
      :height="320"
      :row-height="48"
      :label-width="210"
      editable
      :history="enabled"
      :history-limit="limit"
      :history-keyboard="keyboard"
      :show-history-controls="controls"
      @undo="(entry) => (last = '撤销：' + entry.label)"
      @redo="(entry) => (last = '重做：' + entry.label)"
    />
    <output
      >可撤销 {{ gantt?.historyState.undoCount ?? 0 }} 步 · 可重做
      {{ gantt?.historyState.redoCount ?? 0 }} 步<br />{{ last }}</output
    >
    <p class="hint">
      拖动任务、拉动起止边界，或用 Alt +
      左右键微调；依赖新增、删除和终点改接也会记录。一次拖拽或改接只占一步。Ctrl
      / ⌘ + Z 撤销，Ctrl + Y 或 Ctrl / ⌘ + Shift + Z
      重做；文本输入框保留浏览器自己的撤销行为。选择、缩放和列宽不进入排期历史。
    </p>
  </div>
</template>
