<script setup lang="ts">
import { h, ref } from "vue";
import {
  HysBadge,
  HysProGrid,
  type HysProGridChange,
  type HysProGridColumn,
} from "hys-ui";
import "hys-ui/pro-grid.css";

type Record = { id: number; title: string; active: boolean };
const rows = ref<Record[]>([
  { id: 1, title: "财务通知", active: true },
  { id: 2, title: "采购提醒", active: false },
]);
const columns: HysProGridColumn<Record>[] = [
  {
    key: "title",
    label: "规则名称",
    width: 230,
    editor: { type: "text", trim: true },
    validate: ({ value }) =>
      (typeof value === "string" && !!value) || "请输入规则名称",
  },
  {
    key: "active",
    label: "是否启用",
    width: 155,
    editor: {
      type: "select",
      options: [
        { label: "启用", value: true },
        { label: "停用", value: false },
      ],
    },
    render: ({ row }) =>
      h(HysBadge, {
        status: row.active ? "success" : "default",
        text: row.active ? "已启用" : "已停用",
      }),
  },
];
function update(change: HysProGridChange<Record>) {
  rows.value = rows.value.map((row) =>
    row.id !== change.rowKey
      ? row
      : change.editor === "text"
        ? { ...row, title: change.value }
        : { ...row, active: change.value === true },
  );
}
</script>

<template>
  <div class="demo-stack">
    <HysProGrid
      :rows="rows"
      :columns="columns"
      row-key="id"
      :grid-options="{ selectable: false }"
      @cell-commit="update"
    />
    <p class="scenario-note">
      双击或按 F2 原位编辑。按 Tab 保存并移到下一格，按 Esc
      取消。状态选项提交布尔值。
    </p>
  </div>
</template>
