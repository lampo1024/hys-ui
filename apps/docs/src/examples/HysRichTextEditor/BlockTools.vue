<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysRichTextEditor } from "hys-ui";
const html = ref("<p>交付摘要</p><p>本周已完成订单复核。</p>");
const plainTextPaste = ref(true);
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="plainTextPaste" label="粘贴时仅保留纯文本" />
    <HysRichTextEditor
      v-model="html"
      :plain-text-paste="plainTextPaste"
      show-block-tools
    />
  </div>
</template>
