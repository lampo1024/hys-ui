<script setup lang="ts">
import { computed, ref } from "vue";
import { useHysRootAttrs } from "../../config";
import HysSelect from "../HysSelect/HysSelect.vue";

export interface KanbanCard {
  id: string;
  title: string;
  column: string;
  owner?: string;
  disabled?: boolean;
}
export interface HysKanbanColumn {
  id: string;
  title: string;
  limit?: number;
}
export interface HysKanbanMove {
  card: KanbanCard;
  from: HysKanbanColumn;
  to: HysKanbanColumn;
}
const props = defineProps<{
  columns: HysKanbanColumn[];
  cards: KanbanCard[];
  disabled?: boolean;
  canMove?: (move: HysKanbanMove) => boolean;
  emptyText?: string;
  reorderable?: boolean;
}>();
const emit = defineEmits<{
  move: [id: string, column: string];
  moveRejected: [move: HysKanbanMove];
  reorder: [column: string, cardIds: string[]];
}>();
defineSlots<{
  card?: (scope: { card: KanbanCard; column: HysKanbanColumn }) => unknown;
  empty?: (scope: { column: HysKanbanColumn }) => unknown;
}>();
const hysRootAttrs = useHysRootAttrs();
const dragged = ref<string>();
const hovered = ref<string>();
const hoverAllowed = ref(false);
const cardsByColumn = computed(() => {
  const grouped = new Map<string, KanbanCard[]>();
  for (const card of props.cards) {
    const column = grouped.get(card.column);
    if (column) column.push(card);
    else grouped.set(card.column, [card]);
  }
  return grouped;
});
const columnById = computed(
  () => new Map(props.columns.map((column) => [column.id, column])),
);
function count(id: string) {
  return cardsByColumn.value.get(id)?.length ?? 0;
}
function limit(column: HysKanbanColumn) {
  return typeof column.limit === "number" &&
    Number.isFinite(column.limit) &&
    column.limit >= 0
    ? Math.floor(column.limit)
    : undefined;
}
function allowed(move: HysKanbanMove) {
  const capacity = limit(move.to);
  return (
    !props.disabled &&
    !move.card.disabled &&
    (capacity === undefined || count(move.to.id) < capacity) &&
    (props.canMove?.(move) ?? true)
  );
}
function options(card: KanbanCard, from: HysKanbanColumn) {
  return props.columns.map((to) => ({
    label: to.title,
    value: to.id,
    disabled: to.id !== from.id && !allowed({ card, from, to }),
  }));
}
function move(card: KanbanCard, column: unknown) {
  if (typeof column !== "string" || card.column === column) return;
  const from = columnById.value.get(card.column);
  const to = columnById.value.get(column);
  if (!from || !to) return;
  const detail = { card, from, to };
  if (allowed(detail)) emit("move", card.id, column);
  else emit("moveRejected", detail);
}
function drop(event: DragEvent, column: string) {
  event.preventDefault();
  const id = event.dataTransfer?.getData("text/plain");
  const card =
    dragged.value === id
      ? props.cards.find((item) => item.id === id)
      : undefined;
  finish();
  if (card) move(card, column);
}
function dragOver(event: DragEvent, to: HysKanbanColumn) {
  if (dragged.value === undefined) return;
  event.preventDefault();
  if (hovered.value === to.id) return;
  const card = props.cards.find((item) => item.id === dragged.value);
  const from = card && columnById.value.get(card.column);
  hovered.value = to.id;
  hoverAllowed.value = !!(card && from && from.id !== to.id && allowed({ card, from, to }));
}
function leave(event: DragEvent) {
  if (!(event.currentTarget as HTMLElement).contains(event.relatedTarget as Node | null))
    hovered.value = undefined;
}
function start(event: DragEvent, card: KanbanCard) {
  if (props.disabled || card.disabled || !event.dataTransfer) {
    event.preventDefault();
    return;
  }
  dragged.value = card.id;
  event.dataTransfer.effectAllowed = "move";
  event.dataTransfer.setData("text/plain", card.id);
}
function finish() {
  dragged.value = undefined;
  hovered.value = undefined;
}
function reorder(card: KanbanCard, offset: number) {
  if (!props.reorderable || props.disabled || card.disabled) return;
  const cards = cardsByColumn.value.get(card.column) ?? [];
  const index = cards.indexOf(card);
  const target = cards[index + offset];
  if (index < 0 || !target || target.disabled) return;
  const ids = cards.map(({ id }) => id);
  ids[index] = target.id;
  ids[index + offset] = card.id;
  emit("reorder", card.column, ids);
}
</script>

<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-kanban">
    <section
      v-for="column in columns"
      :key="column.id"
      class="hys-ui-ent-kanban-col"
      :class="{
        'hys-kanban-drop': hovered === column.id && hoverAllowed,
        'hys-kanban-blocked': hovered === column.id && !hoverAllowed,
      }"
      @dragover="dragOver($event, column)"
      @dragleave="leave"
      @drop="drop($event, column.id)"
    >
      <header>
        <strong>{{ column.title }}</strong>
        <span
          >{{ count(column.id)
          }}<template v-if="limit(column) !== undefined">
            / {{ limit(column) }}</template
          ></span
        >
      </header>
      <article
        v-for="(card, index) in cardsByColumn.get(column.id)"
        :key="card.id"
        :draggable="!disabled && !card.disabled"
        @dragstart="start($event, card)"
        @dragend="finish"
      >
        <slot name="card" :card="card" :column="column">
          <strong>{{ card.title }}</strong>
          <small v-if="card.owner">{{ card.owner }}</small>
        </slot>
        <HysSelect
          :model-value="card.column"
          :aria-label="'移动 ' + card.title"
          :disabled="disabled || card.disabled"
          :options="options(card, column)"
          @update:model-value="move(card, $event)"
        />
        <div v-if="reorderable" class="hys-kanban-order">
          <button type="button" :disabled="disabled || card.disabled || index === 0 || cardsByColumn.get(column.id)?.[index - 1]?.disabled"
            :aria-label="'上移 ' + card.title" @click="reorder(card, -1)">上移</button>
          <button type="button" :disabled="disabled || card.disabled || index + 1 >= count(column.id) || cardsByColumn.get(column.id)?.[index + 1]?.disabled"
            :aria-label="'下移 ' + card.title" @click="reorder(card, 1)">下移</button>
        </div>
      </article>
      <div v-if="!count(column.id)" class="hys-kanban-empty">
        <slot name="empty" :column="column">{{ emptyText || "暂无卡片" }}</slot>
      </div>
    </section>
  </div>
</template>

<style scoped>
.hys-kanban-drop {
  border-color: var(--hys-ui-primary, var(--hys-ui-theme-primary));
}
.hys-kanban-blocked {
  border-color: var(--hys-ui-red, var(--hys-ui-theme-red));
}
.hys-kanban-order { display: flex; flex-wrap: wrap; gap: 6px; }
.hys-kanban-order button {
  padding: 3px 8px;
  border: 1px solid var(--hys-ui-theme-border);
  border-radius: 6px;
  background: var(--hys-ui-theme-surface);
  color: inherit;
  font: inherit;
}
.hys-kanban-order button:disabled { opacity: .45; }
.hys-ui-ent-kanban article[draggable="false"] {
  cursor: default;
}
.hys-kanban-empty {
  padding: 8px 0;
  font-size: 13px;
  color: var(--hys-ui-theme-muted);
}
.hys-ui-ent-kanban:has(.hys-kanban-order) {
  scroll-snap-type: x proximity;
}
.hys-ui-ent-kanban:has(.hys-kanban-order) .hys-ui-ent-kanban-col {
  scroll-snap-align: start;
}
.hys-kanban-order button:focus-visible {
  outline: 2px solid var(--hys-ui-theme-primary);
  outline-offset: 2px;
}
</style>
