<script setup lang="ts">
import { ref } from "vue";
import { HysKanban, type KanbanCard } from "hys-ui";
const columns = [
  { id: "todo", title: "待处理" },
  { id: "review", title: "复核中", limit: 1 },
  { id: "done", title: "已完成" },
];
const cards = ref<KanbanCard[]>([
  { id: "1", title: "归档采购单", column: "todo", owner: "仓储组" },
  { id: "2", title: "核对交付数量", column: "review", owner: "交付组" },
]);
const feedback = ref("");
function move(id: string, column: string) {
  cards.value = cards.value.map((card) =>
    card.id === id ? { ...card, column } : card,
  );
  feedback.value = "";
}
</script>
<template>
  <div class="demo-stack">
    <p class="scenario-note">
      复核中最多容纳一张卡片。移出当前卡片后，即可安排下一项。
    </p>
    <HysKanban
      :columns="columns"
      :cards="cards"
      @move="move"
      @move-rejected="feedback = '目标列已满。'"
    />
    <output v-if="feedback" class="state-output">{{ feedback }}</output>
  </div>
</template>
