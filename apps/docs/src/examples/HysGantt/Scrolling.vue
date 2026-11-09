<script setup lang="ts">
import { ref, watch } from "vue";
import {
  HysGantt,
  HysSelect,
  HysNumberInput,
  HysCheckbox,
  type GanttItem,
} from "hys-ui";
const count = ref(50),
  mode = ref<"fixed" | "max" | "auto" | "default">("fixed"),
  height = ref(420),
  rowHeight = ref(48),
  labelWidth = ref(220),
  labelResizable = ref(true),
  selected = ref<string | number | null>(null),
  items = ref<GanttItem[]>([]);
function dateAt(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
watch(
  count,
  (value) => {
    items.value = Array.from({ length: value }, (_, index) => ({
      id: "task-" + index,
      title:
        "任务 " +
        String(index + 1).padStart(3, "0") +
        " · 项目交付阶段 " +
        ((index % 5) + 1),
      owner: ["李工", "王工", "陈工"][index % 3],
      status: index % 5 === 4 ? "已完成" : "进行中",
      progress: (index % 5) * 25,
      start: dateAt((index % 16) - 8),
      end: dateAt((index % 16) - 6 + (index % 7)),
      dependencies: index > 0 && index % 4 === 0 ? ["task-" + (index - 1)] : [],
    }));
    selected.value = null;
  },
  { immediate: true },
);
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>数据与可视区域</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>高度模式</span
            ><HysSelect
              v-model="mode"
              aria-label="甘特图高度模式"
              :options="[
                { label: '固定高度', value: 'fixed' },
                { label: '最大高度', value: 'max' },
                { label: '随内容展开', value: 'auto' },
                { label: '默认最大高度', value: 'default' },
              ]"
          /></label>
          <label class="demo-field"
            ><span>任务数量</span
            ><HysSelect
              v-model="count"
              aria-label="滚动示例任务数量"
              :options="
                [19, 50, 120].map((value) => ({
                  label: value + ' 项任务',
                  value,
                }))
              "
          /></label>
          <label class="demo-field"
            ><span>可视区高度</span
            ><HysNumberInput
              v-model="height"
              aria-label="甘特图可视区高度"
              :min="240"
              :max="720"
              :step="40"
          /></label>
          <label class="demo-field"
            ><span>任务行高</span
            ><HysNumberInput
              v-model="rowHeight"
              aria-label="甘特图任务行高"
              :min="36"
              :max="80"
              :step="4"
          /></label>
          <label class="demo-field"
            ><span>任务名称列宽</span
            ><HysNumberInput
              v-model="labelWidth"
              aria-label="甘特图任务列宽"
              :min="120"
              :max="600"
              :step="20"
          /></label>
        </div>
      </section>
      <HysCheckbox v-model="labelResizable" label="允许拖动任务列宽" />
    </div>
    <HysGantt
      v-model:items="items"
      v-model="selected"
      :height="mode === 'fixed' ? height : undefined"
      :max-height="
        mode === 'max' ? height : mode === 'auto' ? false : undefined
      "
      :row-height="rowHeight"
      v-model:label-width="labelWidth"
      :label-resizable="labelResizable"
      editable
    />
    <output
      >当前任务：{{ selected ?? "未选择" }} · {{ items.length }} 项任务 ·
      名称列宽：{{ labelWidth }}px</output
    >
    <p class="hint">
      固定或限制高度时，在图表内上下滚动，任务名称与任务条保持同一行，日期表头固定显示；横向滚动时任务名称列保持可见。选择随内容展开时，图表随页面一起滚动。可拖动任务条或使用
      Alt +
      左右键调整排期。拖动任务名称列右侧分隔线可调整宽度，双击还原，聚焦后支持左右键微调。
    </p>
  </div>
</template>
