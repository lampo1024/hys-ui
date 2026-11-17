<script setup lang="ts">
import { ref } from "vue";
import { HysMenu, type HysMenuItem } from "hys-ui";
const open = ref<readonly (number | string)[]>([]);
const items: HysMenuItem[] = [
  {
    key: "support",
    label: "Support",
    badge: 4,
    children: [
      { key: "inbox", label: "Inbox", badge: 4 },
      { key: "escalation", label: "Escalations" },
    ],
  },
  {
    key: "catalog",
    label: "Catalog",
    children: [
      { key: "stock", label: "Stock levels" },
      { key: "suppliers", label: "Suppliers" },
    ],
  },
  {
    key: "reports",
    label: "Reports",
    children: [
      { key: "weekly", label: "Weekly review", shortcut: "Alt W" },
      { key: "audit", label: "Audit log" },
    ],
  },
];
</script>
<template>
  <div class="demo-stack">
    <HysMenu v-model:open-keys="open" :items="items" accordion />
    <small
      >展开另一模块会收起同级分支。焦点在菜单上时按 S 可在 S
      开头的项目间跳转。</small
    >
    <span role="status">已展开 · {{ open.join("、") || "无" }}</span>
  </div>
</template>
