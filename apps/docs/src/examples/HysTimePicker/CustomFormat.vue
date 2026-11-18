<script setup lang="ts">
import { ref } from "vue";
import { HysTimePicker } from "hys-ui";
const value = ref<string|null>("17:30");
const format = (hhmm:string) => hhmm.replace(":", " 时 ") + " 分";
const parse = (text:string) => {
  const match = /^(\d{1,2})\s*时\s*(\d{1,2})\s*分$/.exec(text);
  return match ? match[1].padStart(2,"0") + ":" + match[2].padStart(2,"0") : undefined;
};
</script>

<template>
  <div class="demo-stack">
    <HysTimePicker v-model="value" :formatter="format" :parser="parse" format-hint="17 时 30 分" placement="top-start"
      aria-label="交接时间" :minute-step="15" />
    <p role="status">{{ value || "未选择时间" }}</p>
  </div>
</template>
