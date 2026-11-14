<script setup lang="ts">
import { ref } from "vue";
import { HysCronEditor } from "hys-ui";
const expression = ref("75 9 * * 1-5");
const presets = [
  { label: "工作日 09:00", value: "0 9 * * 1-5" },
  { label: "每 15 分钟", value: "*/15 * * * *" },
];
</script>
<template><HysCronEditor v-model="expression" :presets="presets" /></template>
