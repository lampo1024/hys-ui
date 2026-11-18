<script setup lang="ts">
import { ref } from "vue";
import { HysDateTimePicker } from "hys-ui";
const value = ref("2026-11-18 09:30:00");
</script>

<template>
  <div class="demo-stack">
    <HysDateTimePicker v-model="value" show-seconds aria-label="交付预约时间" />
    <p aria-live="polite">已填预约时间 {{ value || "未设置" }}</p>
  </div>
</template>
