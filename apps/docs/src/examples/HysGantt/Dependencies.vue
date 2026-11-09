<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysGantt,
  HysSelect,
  HysCheckbox,
  HysButton,
  type GanttItem,
  type HysGanttInstance,
  type HysGanttDependencyInvalid,
} from "hys-ui";
const gantt = ref<HysGanttInstance>(),
  enabled = ref(true),
  show = ref(true),
  source = ref("requirements"),
  target = ref("backend"),
  lastEvent = ref("尚未编辑依赖");
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
    id: "requirements",
    title: "需求确认",
    start: day(-5),
    end: day(-3),
    progress: 100,
  },
  {
    id: "backend",
    title: "接口开发",
    start: day(0),
    end: day(4),
    progress: 40,
  },
  {
    id: "frontend",
    title: "页面开发",
    start: day(0),
    end: day(5),
    progress: 30,
  },
  {
    id: "integration",
    title: "联调测试",
    start: day(6),
    end: day(8),
    dependencies: ["backend", "frontend"],
  },
  {
    id: "release",
    title: "发布验收",
    start: day(9),
    end: day(10),
    dependencies: ["integration"],
  },
  {
    id: "archive",
    title: "归档记录（不可编辑）",
    start: day(11),
    end: day(12),
    disabled: true,
  },
]);
const options = computed(() =>
  items.value.map((item) => ({
    label: item.title,
    value: item.id,
    disabled: item.disabled,
  })),
);
function title(id: string | number) {
  return items.value.find((item) => item.id === id)?.title ?? String(id);
}
function invalid(info: HysGanttDependencyInvalid) {
  lastEvent.value = JSON.stringify(info);
}
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>关系编辑</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>前置任务</span
            ><HysSelect
              v-model="source"
              :options="options"
              aria-label="前置任务" /></label
          ><label class="demo-field"
            ><span>后置任务</span
            ><HysSelect
              v-model="target"
              :options="options"
              aria-label="后置任务"
          /></label>
        </div>
      </section>
      <div class="demo-control-actions">
        <HysCheckbox v-model="enabled" label="允许编辑依赖" /><HysCheckbox
          v-model="show"
          label="显示依赖连线"
        /><HysButton
          :disabled="!enabled"
          @click="gantt?.addDependency(source, target)"
          >添加依赖</HysButton
        ><HysButton
          variant="secondary"
          :disabled="!enabled"
          @click="gantt?.removeDependency(source, target)"
          >移除依赖</HysButton
        >
      </div>
    </div>
    <HysGantt
      ref="gantt"
      v-model:items="items"
      :height="360"
      :row-height="48"
      :label-width="210"
      editable
      :dependency-editable="enabled"
      :show-dependencies="show"
      @dependency-add="
        (info) =>
          (lastEvent =
            '已连接：' + title(info.sourceId) + ' → ' + title(info.targetId))
      "
      @dependency-remove="
        (info) =>
          (lastEvent =
            '已移除：' + title(info.sourceId) + ' → ' + title(info.targetId))
      "
      @dependency-invalid="invalid"
    />
    <output>{{ lastEvent }}</output>
    <p class="hint">
      悬停任务条，拖动右侧圆点到后置任务。也可点击圆点后点击目标，或按 Enter
      开始、上下键选择、Enter 确认、Esc 取消。选中依赖连线后可点击“移除依赖”或按
      Delete。重复、自身、循环关系与禁用任务会给出提示。依赖编辑保留当前任务排期。
    </p>
  </div>
</template>
