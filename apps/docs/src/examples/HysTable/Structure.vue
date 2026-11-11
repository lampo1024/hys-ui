<script setup lang="ts">
import { defineComponent, h } from "vue";
import { HysTable, type HysTableColumn, type HysTableComponents } from "hys-ui";

const rows = [
  { id: 1, name: "陈晓", team: "设计组", status: "进行中" },
  { id: 2, name: "林夕", team: "研发组", status: "已完成" },
];
const columns: HysTableColumn<(typeof rows)[number]>[] = [
  { key: "name", label: "成员信息", headerColSpan: 2, rowScope: "row" },
  { key: "team", label: "团队", headerColSpan: 0 },
  { key: "status", label: "状态" },
];
const MemberRow = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs, slots }) {
    return () =>
      h("tr", { ...attrs, "data-record-kind": "member" }, slots.default?.());
  },
});
const components: HysTableComponents = { body: { row: MemberRow } };
</script>

<template>
  <div class="demo-stack">
    <HysTable
      :rows="rows"
      :columns="columns"
      :components="components"
      bordered
    />
    <p class="scenario-note">
      成员信息表头覆盖姓名和团队两列。自定义数据行组件为每行添加业务属性，并转发表格提供的属性、事件和单元格。
    </p>
  </div>
</template>
