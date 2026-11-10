<script setup lang="ts">
import { ref } from "vue";
import {
  HysContextMenu,
  HysButton,
  type HysContextMenuItem,
  type HysMenuKey,
} from "hys-ui";
const checked = ref<HysMenuKey[]>(["toolbar", "normal"]);
const items: HysContextMenuItem[] = [
  {
    type: "group",
    label: "显示设置",
    children: [
      { label: "工具栏", value: "toolbar", type: "checkbox" },
      { label: "行号", value: "lines", type: "checkbox" },
      { label: "只读信息", value: "locked", type: "checkbox", disabled: true },
    ],
  },
  { type: "divider", label: "" },
  {
    type: "group",
    label: "显示密度",
    children: [
      { label: "紧凑", value: "compact", type: "radio" },
      { label: "标准", value: "normal", type: "radio" },
      { label: "宽松", value: "relaxed", type: "radio" },
    ],
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-content">
      <HysContextMenu
        v-model:checked-keys="checked"
        trigger="click"
        :items="items"
        ><HysButton>显示设置</HysButton></HysContextMenu
      >
    </div>
    <output class="state-output">勾选值：{{ checked }}</output>
    <p class="scenario-note">
      复选项与单选项默认操作后保持展开。radioGroup 可隔离多个单选组；每项的
      closeOnSelect 可覆盖关闭策略。checkedChange 仅在调用方接受更新后触发。
    </p>
  </div>
</template>
