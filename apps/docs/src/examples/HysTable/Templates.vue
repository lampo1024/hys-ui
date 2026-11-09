<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTable,
  HysAvatar,
  HysBadge,
  HysButton,
  type HysTableColumn,
} from "hys-ui";
type Person = {
  id: number;
  name: string;
  team: string;
  age: number;
  budget: number;
  note: string;
  active: boolean;
};
const rows = ref<Person[]>(
  Array.from({ length: 18 }, (_, i) => ({
    id: i + 1,
    name:
      ["陈晓", "林夕", "周宁", "许晨", "方悦", "李然"][i % 6] +
      (i >= 6 ? " " + (i + 1) : ""),
    team: ["design", "dev", "qa"][i % 3],
    age: 24 + (i % 12),
    budget: 1200 + i * 350,
    note: "负责产品设计、研发协作和交付跟进，记录工作进展与阶段目标。",
    active: i % 4 !== 0,
  })),
);
const columns: HysTableColumn<Person>[] = [
  { key: "name", label: "姓名", width: 140, sortable: true },
  {
    key: "team",
    label: "团队",
    width: 130,
    filters: [
      { label: "设计", value: "design" },
      { label: "研发", value: "dev" },
      { label: "质量", value: "qa" },
    ],
  },
  { key: "age", label: "年龄", width: 100, sortable: true, align: "right" },
  {
    key: "budget",
    label: "预算",
    width: 140,
    align: "right",
    sortable: true,
    summary: "sum",
  },
];
const message = ref("");
</script>
<template>
  <div>
    <HysTable
      :rows="rows.slice(0, 5)"
      :columns="[...columns, { key: 'actions', label: '操作', width: 100 }]"
      ><template #title><strong>成员工作台</strong></template
      ><template #header-budget="{ column }">{{ column.label }}（元）</template
      ><template #name="{ row }"
        ><span class="table-person"
          ><HysAvatar :name="row.name" size="sm" />{{ row.name }}</span
        ></template
      ><template #team="{ value }"
        ><HysBadge
          :tone="
            value === 'design' ? 'purple' : value === 'dev' ? 'blue' : 'green'
          "
          >{{
            value === "design" ? "设计" : value === "dev" ? "研发" : "质量"
          }}</HysBadge
        ></template
      ><template #actions="{ row }"
        ><HysButton
          size="sm"
          variant="ghost"
          @click.stop="message = '查看 ' + row.name"
          >查看</HysButton
        ></template
      ><template #footer
        >操作事件由宿主处理，表格保留原始行对象。</template
      ></HysTable
    ><output class="state-output">{{ message || "点击查看操作" }}</output>
  </div>
</template>
<style scoped>
.table-person {
  display: flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
</style>
