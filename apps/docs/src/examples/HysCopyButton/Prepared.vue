<script setup lang="ts">
import { ref } from "vue";
import { HysCopyButton, HysInput } from "hys-ui";
const file = ref("delivery-checklist.pdf");
const result = ref("");
let sequence = 0;
async function prepare({
  text,
  signal,
}: {
  text: string;
  signal: AbortSignal;
}) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (signal.aborted) throw signal.reason;
  const link = new URL(
    "https://files.example.com/share/" + encodeURIComponent(text),
  );
  link.searchParams.set("preview", String(++sequence));
  return link.href;
}
</script>
<template>
  <div class="demo-stack">
    <HysInput v-model="file" label="文件名" />
    <HysCopyButton
      :text="file"
      :prepare-text="prepare"
      :disabled="!file.trim()"
      label="生成并复制分享链接"
      manual-fallback
      @copy="result = $event"
    />
    <small>单击时生成演示链接，连续点击只处理一次。示例在本地生成链接。</small>
    <span v-if="result" class="state-output">{{ result }}</span>
  </div>
</template>
