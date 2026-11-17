<script setup lang="ts">
import { ref } from "vue";
import {
  HysCheckbox,
  HysTreeTable,
  type HysTableColumn,
  type HysTableKey,
} from "hys-ui";
type Branch = { id: string; name: string; children?: Branch[] };
const branches: Branch[] = [
  {
    id: "A",
    name: "华东服务区",
    children: [
      {
        id: "A1",
        name: "杭州组",
        children: [
          { id: "A11", name: "夜间值班" },
          { id: "A12", name: "白班调度" },
        ],
      },
      { id: "A2", name: "苏州组" },
    ],
  },
  {
    id: "B",
    name: "华南服务区",
    children: [
      { id: "B1", name: "深圳组", children: [{ id: "B11", name: "夜间值班" }] },
    ],
  },
];
const columns: HysTableColumn<Branch>[] = [{ key: "name", label: "服务组织" }];
const cascade = ref(true);
const selected = ref<HysTableKey[]>([]);
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="cascade" @update:model-value="selected = []"
      >选择分支时联动后代</HysCheckbox
    >
    <HysTreeTable
      v-model:selected-row-keys="selected"
      :data="branches"
      :columns="columns"
      :selection-mode="cascade ? 'cascade' : 'independent'"
      selectable
      searchable
      search-label="查找服务节点"
    />
    <small
      >搜索「夜间」可看到两个班组及各自的组织路径。清空搜索后恢复之前的展开状态。</small
    >
    <span role="status">已选节点 · {{ selected.join("、") || "无" }}</span>
  </div>
</template>
