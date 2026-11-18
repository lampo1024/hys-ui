<script setup lang="ts">
import { ref } from "vue";
import { HysDropdown, type HysMenuItem } from "hys-ui";
const result = ref("");
const items: HysMenuItem[] = [
  {
    key: "delivery",
    label: "交付操作",
    children: [
      { key: "packing", label: "打印装箱单", keywords: ["print", "PDF"], shortcut: "Alt+P" },
      { key: "export", label: "导出核对数据", keywords: ["csv", "download"] },
      { key: "reopen", label: "重新打开批次", description: "批次已签收", disabled: true },
    ],
  },
  {
    key: "inventory",
    label: "库存操作",
    children: [
      { key: "lookup", label: "查看实时库存", keywords: ["stock"] },
      { key: "count", label: "创建盘点任务", keywords: ["count"] },
    ],
  },
];
</script>
<template>
  <div class="demo-stack">
    <div>
      <HysDropdown
        :items="items"
        searchable
        search-label="输入命令或缩写"
        label="交付工作台命令"
        @select="
          (_key, { item }) =>
            (result = '当前命令 · ' + ('label' in item ? item.label : ''))
        "
      />
    </div>
    <span role="status">{{ result || "试试搜索 PDF、CSV 或 盘点" }}</span>
  </div>
</template>
