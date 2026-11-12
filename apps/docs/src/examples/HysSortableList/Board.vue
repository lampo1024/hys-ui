<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import {
  HysCheckbox,
  HysSelect,
  HysSortableList,
  type HysSortChange,
  type HysSortGroup,
  type HysSortKey,
  type HysSortOperation,
  type HysSortProposal,
} from "hys-ui";

interface Card {
  id: string;
  label: string;
  team: string;
}
const columns = ref([
  { id: "backlog", label: "待处理" },
  { id: "active", label: "进行中" },
  { id: "done", label: "已完成" },
]);
const cards = reactive<Record<string, Card[]>>({
  backlog: [
    { id: "a", label: "更新组件示例", team: "前端" },
    { id: "b", label: "核对验收清单", team: "产品" },
    { id: "c", label: "整理交付说明", team: "产品" },
  ],
  active: [{ id: "d", label: "检查窄屏布局", team: "设计" }],
  done: [],
});
const selected = reactive<Record<string, HysSortKey[]>>({
  backlog: [],
  active: [],
  done: [],
});
const operation = ref<HysSortOperation>("move");
const isolateDone = ref(false);
const feedback = ref("勾选卡片后，拖动其中一张可批量放置。");
const selectedCount = computed(() =>
  Object.entries(cards).reduce(
    (count, [lane, items]) =>
      count + items.filter((card) => selected[lane].includes(card.id)).length,
    0,
  ),
);
const group = computed<HysSortGroup<Card>>(() => ({
  name: "work-board",
  pull: operation.value,
  put: ["work-board"],
}));
let copy = 0;
function clone(item: Card, proposal: HysSortProposal<Card>) {
  const suffix = proposal.operation === "clone" ? "（克隆）" : "（副本）";
  return { ...item, id: `board-copy-${++copy}`, label: item.label + suffix };
}
function changed(event: HysSortChange<Card>) {
  if (event.action !== "sort" || !event.proposal) return;
  const { from, to, items } = event.proposal;
  feedback.value =
    from.id === to.id
      ? `已调整 ${items.length} 张卡片的顺序`
      : `已${{ move: "移动", copy: "复制", clone: "克隆" }[event.proposal.operation]}${items.length} 张卡片`;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-preview board-toolbar">
      <label class="demo-toolbar-field cross-field"
        >跨列操作
        <HysSelect
          v-model="operation"
          :options="[
            { value: 'move', label: '移动' },
            { value: 'copy', label: '复制' },
            { value: 'clone', label: '克隆' },
          ]"
        />
      </label>
      <div class="demo-control-actions board-options">
        <HysCheckbox v-model="isolateDone" label="隔离已完成列" />
        <small>{{ selectedCount }} 张已选 · 进行中最多 4 张</small>
      </div>
    </div>
    <HysSortableList
      v-model="columns"
      layout="grid"
      :show-buttons="false"
      class="board"
      aria-label="看板列顺序"
    >
      <template #item="{ item: column }">
        <section class="lane">
          <header>
            <strong>{{ column.label }}</strong
            ><small>{{ cards[column.id].length }} 张</small>
          </header>
          <HysSortableList
            v-model="cards[column.id]"
            v-model:selected-keys="selected[column.id]"
            :list-id="'board-' + column.id"
            :aria-label="column.label"
            :group="isolateDone && column.id === 'done' ? 'completed' : group"
            :max-items="column.id === 'active' ? 4 : undefined"
            :clone="clone"
            selectable
            :show-buttons="false"
            snap
            @change="changed"
            @invalid="feedback = $event.message"
          >
            <template #item="{ item }">
              <span class="card-label"
                >{{ item.label }}<small>{{ item.team }}</small></span
              >
            </template>
            <template #empty>拖放卡片到这里</template>
          </HysSortableList>
        </section>
      </template>
      <template #preview="{ drag }"
        >看板列 · {{ drag.items[0].label }}</template
      >
    </HysSortableList>
    <small class="board-status" role="status">{{ feedback }}</small>
  </div>
</template>

<style scoped>
.board-toolbar {
  align-items: flex-end;
}
.board-options {
  min-height: 38px;
}
.board-options small {
  color: var(--docs-muted);
}
.cross-field {
  inline-size: min(100%, 11rem);
}
.board {
  --hys-sort-grid-min: 15rem;
}
.board > :deep(.hys-sort-viewport > div > .hys-sort-list) {
  align-items: stretch;
}
.board > :deep(.hys-sort-viewport > div > .hys-sort-list > .hys-sort-row) {
  align-items: flex-start;
  gap: 4px;
  background: var(--docs-bg);
}
.board
  > :deep(
    .hys-sort-viewport
      > div
      > .hys-sort-list
      > .hys-sort-row
      > .hys-sort-content
  ) {
  display: flex;
  align-self: stretch;
}
.lane {
  display: flex;
  flex: 1;
  flex-direction: column;
  min-inline-size: 0;
  gap: 8px;
}
.lane > :deep([data-sort-root]) {
  flex: 1;
}
.lane header {
  display: flex;
  min-block-size: 30px;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.lane small,
.board-status {
  color: var(--docs-muted);
}
.card-label {
  display: grid;
  gap: 2px;
}
</style>
