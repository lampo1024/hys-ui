<script setup lang="ts">
import { ref } from "vue";
import {
  HysContextMenu,
  HysButton,
  HysCheckbox,
  type HysMenuKey,
} from "hys-ui";
const selected = ref<HysMenuKey[]>(["week"]),
  multiple = ref(false);
const items = [
  { label: "日视图", value: "day" },
  { label: "周视图", value: "week" },
  { label: "月视图", value: "month" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="multiple" label="允许多选" /><HysButton
        size="sm"
        variant="ghost"
        @click="selected = []"
        >清空选择</HysButton
      >
    </div>
    <div class="demo-content">
      <HysContextMenu
        v-model:selected-keys="selected"
        :multiple="multiple"
        selectable
        :hide-on-click="false"
        trigger="click"
        :items="items"
        ><HysButton>选择视图</HysButton></HysContextMenu
      >
    </div>
    <output class="state-output">当前选择：{{ selected }}</output>
    <p class="scenario-note">
      普通操作菜单默认不维护选中项。selectable 启用选中反馈；multiple
      可切换多项，selectedKeys 与 checkedKeys 分开维护。
    </p>
  </div>
</template>
