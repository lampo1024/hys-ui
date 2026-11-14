<script setup lang="ts">
import { ref } from "vue";
import { HysMarkdownEditor } from "hys-ui";

const markdown = ref([
  "# 库存接口接入",
  "",
  "## 开发环境",
  "",
  "| 环境 | 接口 |",
  "| --- | --- |",
  "| 测试 | /inventory/staging |",
  "| 正式 | /inventory |",
  "",
  "## 请求示例",
  "",
  "```bash",
  "curl https://example.com/inventory",
  "```",
  "",
  "## 验收",
  "",
  "确认 /inventory 返回当前仓库的库存。",
].join("\n"));
</script>

<template>
  <div class="demo-stack">
    <HysMarkdownEditor v-model="markdown" />
    <p class="scenario-note">用「标题大纲」跳到「请求示例」，复制代码。也可以用 Ctrl / ⌘ + F 查找 /inventory，再试试全部替换和撤销。</p>
  </div>
</template>
