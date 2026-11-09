<script setup lang="ts">
import { ref, shallowRef, watch, nextTick } from "vue";
import {
  HysGantt,
  HysSelect,
  HysNumberInput,
  HysButton,
  type GanttItem,
  type HysGanttInstance,
} from "hys-ui";
const count = ref(5000),
  height = ref(480),
  target = ref(1),
  selected = ref<string | number | null>(null),
  items = shallowRef<GanttItem[]>([]),
  gantt = ref<HysGanttInstance>(),
  message = ref(""),
  lastChange = ref("");
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
  (size) => {
    const dates = Array.from({ length: 70 }, (_, index) => dateAt(index - 20));
    items.value = Array.from({ length: size }, (_, index) => ({
      id: "bulk-" + (index + 1),
      title:
        "任务 " +
        String(index + 1).padStart(5, "0") +
        " · " +
        ["需求分析", "接口开发", "联调验证", "测试验收"][index % 4],
      owner: ["李工", "王工", "陈工", "林工"][index % 4],
      status: index % 5 === 4 ? "已完成" : "进行中",
      progress: (index % 5) * 25,
      start: dates[index % 40],
      end: dates[(index % 40) + 1 + (index % 8)],
      dependencies: index > 0 && index % 5 === 0 ? ["bulk-" + index] : [],
    }));
    target.value = 1;
    selected.value = null;
    message.value = "";
    lastChange.value = "";
    void nextTick(() => gantt.value?.scrollToTop());
  },
  { immediate: true },
);
async function locate(row: number) {
  const index = Math.max(1, Math.min(items.value.length, Math.round(row)));
  target.value = index;
  const item = items.value[index - 1];
  if (item && (await gantt.value?.scrollToTask(item.id))) {
    selected.value = item.id;
    message.value = "已定位第 " + index + " 项任务";
  }
}
</script>
<template>
  <div class="demo-content">
    <div class="demo-controls">
      <section class="demo-control-section">
        <h3>数据与定位</h3>
        <div class="demo-control-fields">
          <label class="demo-field"
            ><span>任务规模</span
            ><HysSelect
              v-model="count"
              aria-label="大数据任务数量"
              :options="
                [1000, 5000, 10000].map((value) => ({
                  label: value.toLocaleString() + ' 项任务',
                  value,
                }))
              "
          /></label>
          <label class="demo-field"
            ><span>可视区高度</span
            ><HysNumberInput
              v-model="height"
              aria-label="大数据可视区高度"
              :min="280"
              :max="720"
              :step="40"
          /></label>
          <label class="demo-field"
            ><span>任务序号</span
            ><HysNumberInput
              v-model="target"
              aria-label="定位任务序号"
              :min="1"
              :max="count"
              :show-controls="false"
              select-on-focus
          /></label>
        </div>
      </section>
      <div class="demo-control-actions">
        <HysButton variant="secondary" @click="locate(1)">首项</HysButton
        ><HysButton variant="secondary" @click="locate(Math.ceil(count / 2))"
          >中间</HysButton
        ><HysButton variant="secondary" @click="locate(count)">末项</HysButton
        ><HysButton @click="locate(target)">定位指定任务</HysButton>
      </div>
    </div>
    <HysGantt
      ref="gantt"
      v-model:items="items"
      v-model="selected"
      :height="height"
      :row-height="44"
      :label-width="220"
      virtual
      :overscan="6"
      editable
      @change="
        (item) => (lastChange = item.id + '：' + item.start + ' 至 ' + item.end)
      "
      @dependency-add="
        (info) =>
          (lastChange = '已连接 ' + info.sourceId + ' → ' + info.targetId)
      "
      @dependency-remove="
        (info) =>
          (lastChange = '已移除 ' + info.sourceId + ' → ' + info.targetId)
      "
      @dependency-move="
        (info) =>
          (lastChange =
            '已改接 ' +
            info.sourceId +
            '：' +
            info.previousTargetId +
            ' → ' +
            info.targetId)
      "
    />
    <output
      >{{ message || "可上下滚动，或按任务序号定位" }} · 共
      {{ count.toLocaleString() }} 项任务<span v-if="lastChange"
        ><br />最近调整：{{ lastChange }}</span
      ></output
    >
    <p class="hint">
      启用虚拟滚动，只渲染可视任务与缓冲区，任务名称、时间轴和依赖线使用同一行位置。定位后可点击任务、拖动调整排期，或使用
      Alt +
      左右键微调。拖动任务右侧圆点可连接后置任务，拖动任务列右侧分隔线可调整名称列宽。
    </p>
  </div>
</template>
