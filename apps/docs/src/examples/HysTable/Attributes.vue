<script setup lang="ts">
import { ref } from "vue";
import { HysTable, HysBadge, type HysTableColumn } from "hys-ui";
type Entry = { id: number; name: string; amount: number; state: string };
const last = ref("尚未双击金额单元格");
const rows: Entry[] = [
  { id: 1, name: "产品设计", amount: 18000, state: "已确认" },
  { id: 2, name: "应用研发", amount: 42000, state: "待确认" },
  { id: 3, name: "集成验证", amount: 12000, state: "已确认" },
];
const columns: HysTableColumn<Entry>[] = [
  { key: "name", label: "交付内容", rowScope: "row", width: 180 },
  {
    key: "amount",
    label: "预算",
    align: "right",
    customCell: (ctx) => ({
      "data-amount": String(ctx.value),
      title: "双击查看预算",
      onDblclick: () => (last.value = ctx.row.name + "：¥ " + ctx.value),
    }),
  },
  { key: "state", label: "状态", width: 130 },
];
</script>
<template>
  <div>
    <div class="demo-content">
      <HysTable
        :rows="rows"
        :columns="columns"
        :custom-row="
          (row) => ({
            'data-state': row.state,
            'aria-label': row.name + '，' + row.state,
          })
        "
        :custom-header-row="
          (_columns, index) => ({ 'data-header-level': index })
        "
        :custom-header-cell="(column) => ({ title: '列：' + column.label })"
        ><template #state="{ value }"
          ><HysBadge :tone="value === '已确认' ? 'green' : 'orange'">{{
            value
          }}</HysBadge></template
        ></HysTable
      >
    </div>
    <output class="state-output">{{ last }}</output>
    <p class="scenario-note">
      行和单元格可添加 data
      属性、辅助技术标签和事件。第一列使用行标题语义；固定定位、合并范围和数据内容仍由表格管理。双击预算试试。
    </p>
  </div>
</template>
