<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysTable, type HysTableColumn, type HysTableKey, type HysTableSelectionAction } from "hys-ui";
type Member = { id: number; name: string; role: string };
const selected = ref<HysTableKey[]>([]);
const custom = ref(false);
const rows: Member[] = Array.from({ length: 14 }, (_, i) => ({
  id: i + 1,
  name:
    ["陈晓", "林夕", "周宁", "许晨", "方悦", "李然", "王泽"][i % 7] +
    " " +
    (i + 1),
  role: i === 2 ? "暂不可分配" : "项目成员",
}));
const columns: HysTableColumn<Member>[] = [
  { key: "name", label: "成员", sortable: true },
  { key: "role", label: "角色" },
];
const actions: HysTableSelectionAction<Member>[] = [
  {
    key: "even",
    label: "选中本页偶数编号",
    select: async ({ rows, setSelected }) => {
      await setSelected(rows.filter(({ id }) => id % 2 === 0).map(({ id }) => id));
    },
  },
];
</script>
<template>
  <div>
    <HysCheckbox v-model="custom">使用业务选择操作</HysCheckbox>
    <div class="demo-content">
      <HysTable
        v-model:selected-row-keys="selected"
        :rows="rows"
        :columns="columns"
        :selectable="(row) => row.id !== 3"
        range-selection
        :selection-actions="custom ? actions : true"
        reserve-selection
        :pagination="{ pageSize: 7 }"
      />
    </div>
    <output class="state-output"
      >已选编号：{{ selected.join("、") || "无" }}</output
    >
    <p class="scenario-note">
      先勾选一行，再按住 Shift
      勾选另一行，即可选择或取消两行之间的可用行。批量操作作用于当前筛选页；反选保留其他页面的选择，清空选择作用于全部页面。第
      3 行禁用。自定义操作接收当前页可选行和已选编号，可按业务条件设置本页选择。
    </p>
  </div>
</template>
