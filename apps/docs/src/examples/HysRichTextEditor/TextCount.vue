<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysRichTextEditor } from "hys-ui";
const editor = ref<InstanceType<typeof HysRichTextEditor>>();
const content = ref("<p>交付摘要</p><p>订单已经完成复核。</p>");
const text = ref("");
</script>

<template>
  <div class="demo-stack">
    <HysRichTextEditor ref="editor" v-model="content" show-text-count />
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="text = editor?.getText() ?? ''"
        >查看纯文本</HysButton
      >
    </div>
    <output v-if="text" class="state-output" style="white-space: pre-wrap">{{
      text
    }}</output>
  </div>
</template>
