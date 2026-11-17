<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysDropdown, type HysMenuItem } from "hys-ui";
const open = ref(false);
const keep = ref(true);
const exports = ref<string[]>([]);
const items: HysMenuItem[] = [
  { key: "csv", label: "CSV 表格" },
  { key: "pdf", label: "PDF 报表" },
  { key: "json", label: "JSON 原始数据" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox v-model="keep">选择后保持菜单打开</HysCheckbox>
      <HysButton size="sm" variant="ghost" @click="open = !open">{{
        open ? "收起选项" : "查看导出选项"
      }}</HysButton>
      <HysDropdown
        v-model:open="open"
        label="导出格式"
        :items="items"
        :close-on-select="!keep"
        @select="
          (_key, { item }) => {
            if ('label' in item) exports.push(item.label);
          }
        "
      />
    </div>
    <span role="status">{{
      exports.length ? exports.join("、") : "尚未选择格式"
    }}</span>
  </div>
</template>
