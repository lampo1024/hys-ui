<script setup lang="ts">
import { ref } from "vue";
import { HysFilterBar, type HysFilterField } from "hys-ui";
const result = ref("");
const fields: HysFilterField[] = [
  { key: "case", type:"text", label:"工单号", rules: { pattern: /^TK-\d+$/, message: "使用 TK- 开头的工单号" } },
  { key: "own", type:"boolean", label:"只看我的", checkLabel:"只看我的" }
];
</script>

<template>
  <div class="demo-stack">
    <HysFilterBar :fields="fields" :initial-values="{case:'TK-1024',own:true}" actions-align="end" show-clear show-summary
      @search="result = JSON.stringify($event)" @clear="result = '条件已清空'" />
    <p v-if="result" aria-live="polite">{{ result }}</p>
  </div>
</template>
