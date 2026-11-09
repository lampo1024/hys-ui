<script setup lang="ts">
import { ref, computed } from "vue";
import {
  HysTable,
  HysInput,
  HysNumberInput,
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
const editing = ref<number | null>(null),
  snapshot = ref<Person>(),
  message = ref("");
function edit(row: Person) {
  snapshot.value = { ...row };
  editing.value = row.id;
}
function cancel(row: Person) {
  if (snapshot.value) Object.assign(row, snapshot.value);
  editing.value = null;
}
</script>
<template>
  <div>
    <HysTable
      :rows="rows.slice(0, 5)"
      :columns="[...columns, { key: 'actions', label: '操作', width: 150 }]"
      ><template #name="{ row }"
        ><HysInput
          v-if="editing === row.id"
          v-model="row.name"
          size="sm"
          aria-label="编辑姓名"
        /><span v-else>{{ row.name }}</span></template
      ><template #budget="{ row }"
        ><HysNumberInput
          v-if="editing === row.id"
          v-model="row.budget"
          :show-controls="false"
          size="sm"
          :min="0"
          aria-label="编辑预算"
        /><span v-else>{{ row.budget }}</span></template
      ><template #actions="{ row }"
        ><div class="demo-control-actions">
          <template v-if="editing === row.id"
            ><HysButton
              size="sm"
              variant="ghost"
              @click.stop="
                editing = null;
                message = '已保存 ' + row.name;
              "
              >保存</HysButton
            ><HysButton size="sm" variant="ghost" @click.stop="cancel(row)"
              >取消</HysButton
            ></template
          ><HysButton
            v-else
            size="sm"
            variant="ghost"
            :disabled="editing !== null"
            @click.stop="edit(row)"
            >编辑</HysButton
          >
        </div></template
      ></HysTable
    ><output class="state-output">{{
      message || "使用单元格插槽接入业务编辑与校验，数据由宿主管理。"
    }}</output>
  </div>
</template>
