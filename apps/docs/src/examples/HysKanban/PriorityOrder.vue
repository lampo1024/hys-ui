<script setup lang="ts">
import { ref } from "vue";
import { HysKanban, type KanbanCard } from "hys-ui";
const columns = [
  { id: "todo", title: "待处理" },
  { id: "done", title: "已完成" },
];
const cards = ref<KanbanCard[]>([
  { id: "1", title: "回访客户", column: "todo" },
  { id: "2", title: "复核退货", column: "todo" },
  { id: "3", title: "补充工单", column: "todo" },
]);
function move(id: string, column: string) {
  cards.value = cards.value.map((card) =>
    card.id === id ? { ...card, column } : card,
  );
}
function reorder(column: string, ids: string[]) {
  const index = new Map(cards.value.map((card) => [card.id, card]));
  const sorted = ids.map((id) => index.get(id)!).values();
  cards.value = cards.value.map((card) =>
    card.column === column ? (sorted.next().value ?? card) : card,
  );
}
</script>

<template>
  <HysKanban
    :columns="columns"
    :cards="cards"
    reorderable
    @move="move"
    @reorder="reorder"
  />
</template>
