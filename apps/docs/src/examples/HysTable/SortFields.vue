<script setup lang="ts">
import { ref } from "vue";
import { HysTable, type HysTableColumn, type HysTableSort } from "hys-ui";
type Member = { id: number; name: string; team: string; rank: number };
const sorts = ref<HysTableSort[]>([{ key: "name", direction: "asc" }]);
const rows: Member[] = [
  { id: 1, name: "周工", team: "设计组", rank: 2 },
  { id: 2, name: "陈工", team: "研发组", rank: 2 },
  { id: 3, name: "李工", team: "研发组", rank: 1 },
  { id: 4, name: "吴工", team: "设计组", rank: 1 },
];
const columns: HysTableColumn<Member>[] = [
  {
    key: "name",
    label: "姓名（按团队、顺序排列）",
    sortable: true,
    sortBy: ["team", (r) => r.rank],
    width: 300,
  },
  { key: "team", label: "团队" },
  { key: "rank", label: "团队内顺序", align: "right" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content">
      <HysTable
        v-model:sorts="sorts"
        :rows="rows"
        :columns="columns"
        :sort-orders="['asc', 'desc']"
      />
    </div>
    <output class="state-output">{{ sorts }}</output>
    <p class="scenario-note">
      sortBy 数组按顺序比较字段或取值函数，前一项相同才比较后一项。列
      defaultSortOrder 设置初始顺序，表格 defaultSort 优先；sortOrders
      配置点击标题时的循环。
    </p>
  </div>
</template>
