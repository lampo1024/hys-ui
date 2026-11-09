<script setup lang="ts">
import { ref } from "vue";
import {
  HysTable,
  HysCheckbox,
  HysBadge,
  type HysTableColumn,
  type HysTableSelectionProps,
} from "hys-ui";
type Member = { id: number; name: string; locked: boolean };
const selected = ref<number[]>([]);
const rows: Member[] = [
  { id: 1, name: "张工", locked: false },
  { id: 2, name: "李工", locked: true },
  { id: 3, name: "陈工", locked: false },
];
const columns: HysTableColumn<Member>[] = [
  { key: "name", label: "成员" },
  { key: "locked", label: "可选状态" },
];
const selectionProps = (row: Member): HysTableSelectionProps => ({
  disabled: row.locked,
  label: `选择${row.name}`,
  title: row.locked ? "已锁定，不能选择" : "可以选择",
});
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content">
      <HysTable
        v-model:selected-row-keys="selected"
        :rows="rows"
        :columns="columns"
        selectable
        :selection-column="{ width: 108, align: 'left', fixed: 'left' }"
        :get-selection-props="selectionProps"
        ><template
          #selection-header="{ checked, indeterminate, disabled, toggle }"
          ><HysCheckbox
            :model-value="checked"
            :indeterminate="indeterminate"
            :disabled="disabled"
            @update:model-value="toggle($event === true)"
            >全选</HysCheckbox
          ></template
        ><template #selection-cell="{ row, checked, disabled, toggle }"
          ><HysCheckbox
            :model-value="checked"
            :disabled="disabled"
            :aria-label="`选择${row.name}`"
            @click.stop
            @update:model-value="toggle($event === true)"
            >选择</HysCheckbox
          ></template
        ><template #locked="{ row }"
          ><HysBadge>{{ row.locked ? "已锁定" : "可选择" }}</HysBadge></template
        ></HysTable
      >
    </div>
    <output class="state-output">已选编号：{{ selected }}</output>
    <p class="scenario-note">
      插槽定制选择单元格，toggle 复用内置状态管理。getSelectionProps
      的禁用规则也应用于全选、反选和实例方法，避免界面与操作规则不一致。
    </p>
  </div>
</template>
