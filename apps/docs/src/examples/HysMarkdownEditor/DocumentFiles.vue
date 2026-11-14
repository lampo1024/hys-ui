<script setup lang="ts">
import { ref } from "vue";
import { HysMarkdownEditor } from "hys-ui";

const markdown = ref("# 交接记录\n\n- 核对库存差异\n- 确认下周排班\n");
</script>

<template>
  <div class="demo-stack">
    <HysMarkdownEditor v-model="markdown" />
    <p class="scenario-note">从「更多」下载 Markdown，再导入该文件。也可以先改一行，确认替换正文后用「撤销」恢复。</p>
  </div>
</template>
