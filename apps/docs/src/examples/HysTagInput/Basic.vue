<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput } from "hys-ui";
const tags = ref(["Vue 3", "TypeScript"]);
</script>
<template>
  <div class="demo-stack">
    <HysTagInput v-model="tags" aria-label="技术标签" /><output
      class="state-output"
      >{{ tags.join(" · ") || "暂无标签" }}</output
    >
    <p class="scenario-note">
      按 Enter 添加，草稿为空时按 Backspace 移除末项。默认最多 10
      个标签，失焦时保存草稿。
    </p>
  </div>
</template>
