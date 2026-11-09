<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysTable, HysBadge } from "hys-ui";
import type { HysTableColumn, HysTableKey } from "hys-ui";
const memberKeys = (keys: readonly HysTableKey[]) =>
  keys.filter((key): key is string => typeof key === "string");
interface Member {
  id: string;
  name: string;
  team: string;
  disabled?: boolean;
}
const value = ref(["c"]),
  options: Member[] = [
    { id: "a", name: "林工", team: "产品设计" },
    { id: "b", name: "周工", team: "前端研发" },
    { id: "c", name: "陈工", team: "质量保障" },
    { id: "d", name: "共享账号", team: "系统", disabled: true },
  ];
const columns: HysTableColumn<Member>[] = [
  { key: "name", label: "成员", width: 105 },
  { key: "team", label: "团队", width: 130 },
];
</script>
<template>
  <div class="demo-content">
    <HysTransfer
      v-model="value"
      :options="options"
      :field-names="{ value: 'id', label: 'name' }"
      :list-height="245"
      :list-style="{ padding: '0' }"
      :filter-placeholder="'搜索成员'"
    >
      <template #panel="{ items, checkedKeys, setCheckedKeys, disabled }"
        ><HysTable
          :rows="items"
          :columns="columns"
          :selected-row-keys="checkedKeys"
          :selectable="(row) => !row.disabled"
          :disabled="disabled"
          reserve-selection
          size="sm"
          @update:selected-row-keys="(keys) => setCheckedKeys(memberKeys(keys))"
          ><template #team="{ row }"
            ><HysBadge size="sm" tone="gray">{{ row.team }}</HysBadge></template
          ></HysTable
        ></template
      >
    </HysTransfer>
  </div>
  <output>已移入：{{ value.join("、") }}</output>
  <p class="hint">
    panel 插槽可组合表格或树形列表。使用插槽中的 items、checkedKeys 与
    setCheckedKeys，能够保留跨面板勾选并共享穿梭操作。
  </p>
</template>
