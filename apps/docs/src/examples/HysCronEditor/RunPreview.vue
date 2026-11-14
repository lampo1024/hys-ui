<script setup lang="ts">
import { ref } from "vue";
import { HysCronEditor } from "hys-ui";
const expression = ref("0 9 * * 1-5");
const base = new Date("2026-11-13T09:30:00Z");
const presets = [
  { label: "工作日 09:00", value: "0 9 * * 1-5" },
  { label: "每 15 分钟", value: "*/15 * * * *" },
];
</script>

<template>
  <HysCronEditor
    v-model="expression"
    :presets="presets"
    :preview-count="3"
    :preview-from="base"
  />
</template>
