<script setup lang="ts">
import { ref, shallowRef } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysSelect,
  HysVirtualTable,
  type HysVirtualTableColumn,
  type HysVirtualTableKey,
  type HysVirtualTableSort,
  type HysVirtualTableInstance,
} from "hys-ui";
interface Member {
  id: number;
  name: string;
  quota: number;
  locked: boolean;
}
const rows: Member[] = Array.from({ length: 80 }, (_, i) => ({
  id: i,
  name: "成员 " + String(i + 1).padStart(2, "0"),
  quota: (i * 37) % 100,
  locked: i % 9 === 0,
}));
const columns: HysVirtualTableColumn<Member>[] = [
  { key: "name", label: "成员", width: 150, sortable: true },
  { key: "quota", label: "额度", width: 110, sortable: true, align: "right" },
  {
    key: "locked",
    label: "权限",
    width: 126,
    formatter: ({ row }) => (row.locked ? "仅查看" : "可选择"),
  },
];
const selected = ref<HysVirtualTableKey[]>([]),
  sort = ref<HysVirtualTableSort | null>(null),
  current = ref<HysVirtualTableKey | null>(null);
const accept = ref(true),
  mode = ref<"checkbox" | "radio">("checkbox"),
  table = shallowRef<HysVirtualTableInstance<Member>>();
const modes = [
  { label: "复选", value: "checkbox" },
  { label: "单选", value: "radio" },
];
function updateMode(value: unknown) {
  mode.value = value === "radio" ? "radio" : "checkbox";
  selected.value = [];
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysSelect
        :model-value="mode"
        :options="modes"
        size="sm"
        aria-label="选择模式"
        style="width: 112px"
        @update:model-value="updateMode"
      />
      <HysCheckbox v-model="accept" label="接受受控更新" />
      <HysButton size="sm" @click="table?.clearSelection()">清空选择</HysButton>
    </div>
    <HysVirtualTable
      ref="table"
      :rows="rows"
      :columns="columns"
      :height="238"
      fit
      keyboard
      select-on-click
      highlight-current-row
      :selectable="(row) => !row.locked"
      :selection-type="mode"
      :selected-row-keys="selected"
      :sort-state="sort"
      :current-row-key="current"
      aria-label="成员选择"
      @update:selected-row-keys="
        (value) => {
          if (accept) selected = value;
        }
      "
      @update:sort-state="
        (value) => {
          if (accept) sort = value;
        }
      "
      @update:current-row-key="
        (value) => {
          if (accept) current = value;
        }
      "
    >
      <template #footer
        >已选 {{ selected.length }} 项 · 当前成员
        {{ current === null ? "—" : Number(current) + 1 }} ·
        {{ sort ? sort.key + " " + sort.direction : "默认顺序" }}</template
      >
    </HysVirtualTable>
    <p class="scenario-note">
      表头复选框选择全部可选记录，包括未渲染的行。Shift
      点击可选范围；取消「接受受控更新」可体验宿主拒绝请求。
    </p>
  </div>
</template>
