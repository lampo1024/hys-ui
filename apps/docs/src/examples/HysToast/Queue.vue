<script setup lang="ts">
import { ref, watch } from "vue";
import {
  HysButton,
  HysSelect,
  useHysToast,
  type HysToastConfig,
  type HysToastSnapshot,
} from "hys-ui";

const mode = ref<"replace" | "queue">("queue"),
  order = ref<"fifo" | "lifo">("fifo"),
  scope = ref<"global" | "position" | "type" | "group">("global"),
  snapshots = ref<HysToastSnapshot[]>([]);
const toast = useHysToast({
  maxCount: 2,
  maxQueue: 12,
  duration: 0,
  position: "top-right",
  overflow: "queue",
  closeOnEscape: true,
});
let serial = 0;
function sync() {
  snapshots.value = toast.list();
}
watch([mode, order, scope], ([overflow, queueOrder, queueScope]) => {
  toast.configure({ overflow, queueOrder, queueScope });
  sync();
});
function add(urgent = false, group = "A") {
  const id = "queue-" + ++serial;
  toast.show({
    id,
    group,
    priority: urgent ? 10 : 0,
    type: urgent ? "warning" : "info",
    message:
      (urgent ? "紧急任务 " : "普通任务 ") + serial + " · " + group + " 组",
    onStateChange: sync,
  });
  sync();
}
function repeat(dedupe: "merge" | "ignore") {
  toast.info({
    message: "网络连接已恢复",
    dedupe,
    dedupeKey: "network",
    dedupeWindow: 5000,
    group: "A",
    onStateChange: sync,
  });
  sync();
}
const overflowOptions = [
  { label: "等待空位", value: "queue" },
  { label: "替换旧消息", value: "replace" },
];
const orderOptions = [
  { label: "先进先出", value: "fifo" },
  { label: "后进先出", value: "lifo" },
];
const scopes: { label: string; value: HysToastConfig["queueScope"] }[] = [
  { label: "共享上限", value: "global" },
  { label: "每组独立", value: "group" },
  { label: "每类独立", value: "type" },
  { label: "每个位置独立", value: "position" },
];
const statusLabels = {
  visible: "显示中",
  queued: "等待中",
  closing: "关闭中",
  closed: "已关闭",
};
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >超出两条时<HysSelect
            v-model="mode"
            :options="overflowOptions"
            aria-label="超出数量限制时"
        /></label>
        <label class="demo-field"
          >同优先级顺序<HysSelect
            v-model="order"
            :options="orderOptions"
            aria-label="队列顺序"
        /></label>
        <label class="demo-field"
          >数量限制范围<HysSelect
            v-model="scope"
            :options="scopes"
            aria-label="数量限制范围"
        /></label>
      </div>
    </div>
    <div class="demo-control-actions">
      <HysButton @click="add()">添加 A 组任务</HysButton>
      <HysButton variant="secondary" @click="add(false, 'B')"
        >添加 B 组任务</HysButton
      >
      <HysButton variant="secondary" @click="add(true)">添加紧急任务</HysButton>
      <HysButton variant="secondary" @click="repeat('merge')"
        >合并重复</HysButton
      >
      <HysButton variant="secondary" @click="repeat('ignore')"
        >忽略重复</HysButton
      >
    </div>
    <div class="demo-control-actions">
      <HysButton variant="ghost" @click="toast.clearQueue()"
        >清空等待队列</HysButton
      >
      <HysButton variant="ghost" @click="toast.closeType('warning')"
        >关闭警告</HysButton
      >
      <HysButton variant="ghost" @click="toast.closeAll()">关闭全部</HysButton>
    </div>
    <ul v-if="snapshots.length" class="queue-list" aria-label="消息队列">
      <li v-for="entry in snapshots" :key="entry.id">
        <span
          >{{ entry.message
          }}<template v-if="entry.repeat > 1">
            ×{{ entry.repeat }}</template
          ></span
        >
        <small>{{ statusLabels[entry.status] }}</small>
        <HysButton size="sm" variant="text" @click="toast.close(entry.id)"
          >移除</HysButton
        >
      </li>
    </ul>
    <p v-else class="scenario-note">
      添加三条消息观察排队，关闭一条后等待下一条补位。
    </p>
  </div>
</template>

<style scoped>
.queue-list {
  list-style: none;
  padding: 0;
  margin: 0;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  max-block-size: 220px;
  overflow: auto;
}
.queue-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 10px;
  padding: 5px 12px;
}
.queue-list li + li {
  border-top: 1px solid var(--docs-border);
}
.queue-list span {
  overflow-wrap: anywhere;
}
.queue-list small {
  color: var(--docs-muted);
  white-space: nowrap;
}
</style>
