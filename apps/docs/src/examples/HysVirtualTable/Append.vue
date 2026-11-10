<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref, shallowRef } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysVirtualTable,
  type HysVirtualTableInstance,
} from "hys-ui";
const total = 240,
  batch = 60;
interface Audit {
  id: number;
  description: string;
  level: string;
}
const makeRows = (offset: number, count: number): Audit[] =>
  Array.from({ length: count }, (_, i) => ({
    id: offset + i + 1,
    description: "巡检记录 " + (offset + i + 1),
    level: (offset + i) % 7 === 0 ? "待核验" : "正常",
  }));
const rows = shallowRef(makeRows(0, batch));
const columns = [
  { key: "id", label: "序号", width: 80 },
  { key: "description", label: "巡检记录", width: 220 },
  { key: "level", label: "结果", width: 120 },
];
const table = shallowRef<HysVirtualTableInstance<Audit>>();
const pending = ref(false),
  error = ref(""),
  failNext = ref(false);
let timer: ReturnType<typeof setTimeout> | undefined;
function loadMore() {
  if (pending.value || error.value || rows.value.length >= total) return;
  pending.value = true;
  timer = setTimeout(() => {
    pending.value = false;
    if (failNext.value) {
      failNext.value = false;
      error.value = "本次加载失败，可重试。";
      return;
    }
    rows.value = [
      ...rows.value,
      ...makeRows(
        rows.value.length,
        Math.min(batch, total - rows.value.length),
      ),
    ];
  }, 450);
}
function retry() {
  error.value = "";
  loadMore();
}
function stop() {
  clearTimeout(timer);
  pending.value = false;
}
onDeactivated(stop);
onBeforeUnmount(stop);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton size="sm" @click="table?.scrollToRow(rows.length - 1, 'end')"
        >定位当前末尾</HysButton
      >
      <HysCheckbox v-model="failNext" label="模拟下次加载失败" />
    </div>
    <HysVirtualTable
      ref="table"
      :rows="rows"
      :columns="columns"
      :height="230"
      :loading="pending"
      loading-mode="overlay"
      :end-reached-threshold="64"
      fit
      aria-label="追加巡检记录"
      @end-reached="loadMore"
    >
      <template #loading>正在加载下一批记录…</template>
      <template #footer="{ range }"
        >已加载 {{ rows.length }} / {{ total }} 条 · 可见第
        {{ range.visibleStart + 1 }}–{{ range.visibleEnd + 1 }} 条</template
      >
    </HysVirtualTable>
    <div v-if="error" class="demo-control-actions" role="status">
      <span>{{ error }}</span
      ><HysButton size="sm" variant="primary" @click="retry"
        >重试加载</HysButton
      >
    </div>
    <p class="scenario-note">
      接近底部时自动追加下一批数据。加载完成后停在当前滚动位置，可继续向下查看新增记录。
    </p>
  </div>
</template>
