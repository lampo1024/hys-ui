<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysProGrid,
  type HysProGridChange,
  type HysProGridColumn,
} from "hys-ui";
import { createProGridClipboard } from "hys-ui/pro-grid/clipboard";
import "hys-ui/pro-grid.css";
import "hys-ui/pro-grid/clipboard.css";

interface Expense {
  id: string;
  project: string;
  equipment: number;
  service: number;
  limit: number;
  approved?: boolean;
}

const rows = ref<Expense[]>([
  { id: "B-01", project: "会议室", equipment: 5200, service: 800, limit: 8000 },
  { id: "B-02", project: "培训室", equipment: 4200, service: 600, limit: 6000 },
  {
    id: "B-03",
    project: "机房（已审批）",
    equipment: 9600,
    service: 1200,
    limit: 12000,
    approved: true,
  },
]);
const columns: HysProGridColumn<Expense>[] = [
  { key: "project", label: "项目", width: 128 },
  ...(
    [
      ["equipment", "设备费"],
      ["service", "服务费"],
    ] as const
  ).map(([key, label]): HysProGridColumn<Expense> => ({
    key,
    label,
    width: 120,
    filterable: false,
    sortable: false,
    align: "right",
    editor: { type: "number", min: 0 },
    canEdit: ({ row }) => !row.approved,
    async validate(change, { signal }) {
      await new Promise((resolve) => setTimeout(resolve, 75));
      if (signal.aborted) return false;
      return (
        change.editor !== "number" ||
        (change.value ?? 0) <= change.row.limit ||
        `${label}不能超过项目额度 ¥${change.row.limit.toLocaleString("zh-CN")}。`
      );
    },
  })),
];

const notice = ref("");
const failed = ref(false);
const clipboard = createProGridClipboard<Expense>({
  onPaste(result) {
    failed.value = !result.ok;
    notice.value = result.ok
      ? `已粘贴 ${result.count} 个单元格。`
      : `${result.cell ? `${result.cell.rowKey} · ` : ""}${result.message}`;
  },
});

function applyChanges(changes: readonly HysProGridChange<Expense>[]) {
  const next = new Map(rows.value.map((row) => [row.id, row]));
  for (const change of changes) {
    const row = next.get(String(change.rowKey));
    if (row && change.editor === "number")
      next.set(row.id, { ...row, [change.columnKey]: change.value });
  }
  rows.value = [...next.values()];
}

function pasteSample(kind: "valid" | "invalid" | "locked") {
  clipboard.selectRange({
    rowKey: kind === "locked" ? "B-02" : "B-01",
    columnKey: "equipment",
  });
  const text =
    kind === "invalid" ? "4600\t900\n9200\t750" : "4600\t900\n4100\t750";
  void clipboard.pasteText(text);
}
</script>

<template>
  <div class="demo-stack">
    <div class="expense-actions">
      <HysButton size="sm" @click="pasteSample('valid')"
        >粘贴示例数据</HysButton
      >
      <HysButton size="sm" variant="secondary" @click="pasteSample('invalid')"
        >试粘贴超额数据</HysButton
      >
      <HysButton size="sm" variant="secondary" @click="pasteSample('locked')"
        >试粘贴到已审批行</HysButton
      >
    </div>
    <HysProGrid
      :rows="rows"
      :columns="columns"
      row-key="id"
      :clipboard="clipboard"
      :grid-options="{ selectable: false }"
      @cell-commit="applyChanges([$event])"
      @cells-commit="applyChanges"
    />
    <output
      v-if="notice"
      class="state-output"
      :role="failed ? 'alert' : 'status'"
      >{{ notice }}</output
    >
    <p class="scenario-note">
      拖动框选，或用 Shift 加方向键扩展选区。复制后可粘贴到 Excel，也可从 Excel
      复制数据并从一格开始粘贴。已审批行只允许复制。
    </p>
  </div>
</template>

<style scoped>
.expense-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
