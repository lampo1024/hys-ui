<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysMenu, type HysMenuItem } from "hys-ui";
import { Folder, Check } from "hys-ui/icons";
const compact = ref(false);
const current = ref<readonly (string | number)[]>(["开始"]);
const items: HysMenuItem[] = [
  { key: "开始", label: "首页", icon: Check },
  {
    key: "工作", label: "工作区", icon: Folder, badge: 3,
    children: [
      { key: "待办", label: "待办工作", badge: 3 },
      { key: "完成", label: "已完成工作", disabled: true },
    ],
  },
];
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="compact">仅图标</HysCheckbox>
    <HysMenu v-model:selected-keys="current" :mode="compact ? 'vertical' : 'horizontal'" :collapsed="compact" :items="items" />
    <p aria-live="polite">当前页面 {{ current[0] }}</p>
  </div>
</template>
