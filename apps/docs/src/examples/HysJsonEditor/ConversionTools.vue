<script setup lang="ts">
import { ref } from "vue";
import { HysJsonEditor } from "hys-ui";

const json = ref([
  "[",
  '  {"sku": "002", "quantity": 12, "active": true},',
  '  {"sku": "001", "quantity": 8},',
  '  {"sku": "002", "quantity": 12, "active": true}',
  "]",
].join("\n"));
</script>

<template>
  <div class="demo-stack">
    <HysJsonEditor v-model="json" compactable />
    <p class="scenario-note">在「排序与去重」中选择数组去重，应用后按 sku 排序。打开「格式转换」，下载 CSV 或 YAML，再导入同一文件查看转换结果。生成 TypeScript 类型可看到可选的 active 字段。</p>
  </div>
</template>
