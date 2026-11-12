<script setup lang="ts">
import { ref, useTemplateRef } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysSortableList,
  type HysSortChange,
  type HysSortFeedback,
  type HysSortItem,
  type HysSortableListInstance,
} from "hys-ui";

const list = useTemplateRef<HysSortableListInstance>("list");
const items = ref([
  { id: "guide", label: "入门指南" },
  { id: "rules", label: "编写规范" },
  { id: "release", label: "发布流程" },
]);
const fail = ref(false);
const status = ref("排序保存成功后，刷新页面可保留顺序。");
const saving = ref(false);
let revision = 0;

async function save(change: HysSortChange<HysSortItem>, signal: AbortSignal) {
  saving.value = true;
  status.value = "正在保存顺序";
  const shouldFail = fail.value;
  try {
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(new Error("已取消保存"));
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        resolve();
      }, 600);
      if (signal.aborted) abort();
      else signal.addEventListener("abort", abort, { once: true });
    });
    return change.lists.length > 0 && !shouldFail;
  } finally {
    saving.value = false;
  }
}

function report(change: HysSortChange<HysSortItem>) {
  status.value = {
    sort: "已保存新的顺序",
    undo: "已撤销并保存",
    redo: "已重做并保存",
    reset: "已恢复初始顺序",
    rollback: "已恢复上一次顺序",
  }[change.action];
}
function failed(event: HysSortFeedback<HysSortItem>) {
  status.value =
    event.reason === "save" ? "保存失败，已回滚本次排序。" : event.message;
}
function externalUpdate() {
  const label = `外部新增文档 ${++revision}`;
  items.value = [...items.value, { id: `external-${revision}`, label }];
  status.value = `已接收「${label}」`;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-preview history-tools">
      <div class="demo-control-actions">
        <HysButton
          size="sm"
          variant="secondary"
          :disabled="saving"
          @click="list?.undo()"
          >撤销</HysButton
        >
        <HysButton
          size="sm"
          variant="secondary"
          :disabled="saving"
          @click="list?.redo()"
          >重做</HysButton
        >
        <HysButton
          size="sm"
          variant="secondary"
          :disabled="saving"
          @click="list?.reset()"
          >恢复初始顺序</HysButton
        >
      </div>
      <HysCheckbox v-model="fail" label="模拟保存失败" />
    </div>
    <HysSortableList
      ref="list"
      v-model="items"
      :history="10"
      :save="save"
      aria-label="文档顺序"
      storage-key="hys-docs-sortable-order-v1"
      @change="report"
      @save-error="failed"
      @conflict="failed"
      @cancel="failed"
    />
    <div class="demo-control-actions history-status">
      <small role="status">{{ status }}</small>
      <HysButton size="sm" variant="ghost" @click="externalUpdate"
        >模拟外部更新</HysButton
      >
      <HysButton v-if="saving" size="sm" variant="ghost" @click="list?.cancel()"
        >取消保存</HysButton
      >
    </div>
  </div>
</template>

<style scoped>
.history-status small {
  color: var(--docs-muted);
}
.history-tools {
  gap: 8px 16px;
}
</style>
