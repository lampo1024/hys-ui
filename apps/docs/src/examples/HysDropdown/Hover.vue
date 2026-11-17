<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysDropdown, type HysMenuItem } from "hys-ui";
const destination = ref("未分配");
const items: HysMenuItem[] = [
  { type: "group", label: "可分配队列" },
  {
    key: "region",
    label: "华东区域",
    children: [
      { key: "sh", label: "上海配送中心" },
      { key: "hz", label: "杭州配送中心" },
    ],
  },
  {
    key: "north",
    label: "华北区域",
    children: [{ key: "bj", label: "北京配送中心" }],
  },
];
</script>
<template>
  <div class="demo-row">
    <HysDropdown
      trigger="hover"
      placement="bottom-start"
      :items="items"
      @select="
        (_key, { item }) => (destination = 'label' in item ? item.label : '')
      "
    >
      <template #trigger="{ open, disabled }">
        <HysButton variant="secondary" :pressed="open" :disabled="disabled"
          >分配队列</HysButton
        >
      </template>
    </HysDropdown>
    <span role="status">{{ destination }}</span>
  </div>
</template>
