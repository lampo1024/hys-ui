<script setup lang="ts">
import { ref } from "vue";
import { HysDropdown, type HysMenuItem } from "hys-ui";
const fail = ref(true);
const feedback = ref("");
const commands: HysMenuItem[] = [{ key:"archive",label:"转存附件",action:async () => {
  await new Promise(resolve => setTimeout(resolve, 350));
  if (fail.value) { fail.value = false; throw new Error("暂时无法转存，请重试"); }
}}];
</script>

<template>
  <div class="demo-stack">
    <HysDropdown label="附件操作" :items="commands" @select="feedback = '附件已转存'" @select-error="feedback = String($event === 'archive' ? '暂时无法转存，请重试' : '操作失败')" />
    <p role="status">{{ feedback || "准备转存" }}</p>
  </div>
</template>
