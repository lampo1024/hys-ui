<script setup lang="ts">
import { ref } from "vue";
import { HysMenu, type HysMenuItem } from "hys-ui";
const filename = ref("日结归档 01");
const items: HysMenuItem[] = [
  { type: "group", label: "日结归档" },
  ...Array.from({ length: 45 }, (_, i) => ({
    key: i,
    label: "日结归档 " + String(i + 1).padStart(2, "0"),
  })),
];
</script>
<template>
  <div class="demo-stack">
    <HysMenu
      :items="items"
      :max-height="190"
      :default-selected-keys="[0]"
      aria-label="日结归档目录"
      style="max-width: 308px"
      @select="
        (_key, { item }) => (filename = 'label' in item ? item.label : '')
      "
    />
    <span role="status">{{ filename }}</span>
  </div>
</template>
