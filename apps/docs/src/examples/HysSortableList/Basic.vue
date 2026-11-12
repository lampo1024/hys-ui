<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysSortableList } from "hys-ui";

const items = ref([
  { id: 1, label: "需求评审" },
  { id: 2, label: "技术设计" },
  { id: 3, label: "代码审查" },
  { id: 4, label: "发布上线" },
]);
const last = ref("");
let sequence = 4;

function add() {
  const id = ++sequence;
  items.value = [...items.value, { id, label: `新任务 ${id - 4}` }];
  last.value = "已添加任务";
}
function remove() {
  items.value = items.value.slice(0, -1);
  last.value = "已删除末项";
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-preview">
      <span>拖动手柄、使用上移下移按钮，或按 Alt + ↑ / ↓。</span>
      <div class="demo-control-actions">
        <HysButton size="sm" @click="add">添加任务</HysButton>
        <HysButton
          size="sm"
          variant="secondary"
          :disabled="!items.length"
          @click="remove"
          >删除末项</HysButton
        >
      </div>
    </div>
    <HysSortableList
      v-model="items"
      aria-label="发布任务"
      @change="last = '已更新顺序'"
    >
      <template #item="{ item, index }">
        <span class="task"
          ><small>{{ index + 1 }}</small
          >{{ item.label }}</span
        >
      </template>
      <template #empty>还没有任务，点击「添加任务」开始。</template>
    </HysSortableList>
    <small class="status" role="status"
      >{{ items.length }} 项<span v-if="last"> · {{ last }}</span></small
    >
  </div>
</template>

<style scoped>
.task {
  display: flex;
  align-items: baseline;
  gap: 8px;
}
.task small,
.status {
  color: var(--docs-muted);
}
.task small {
  font-variant-numeric: tabular-nums;
}
</style>
