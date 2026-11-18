<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysPageHeader } from "hys-ui";
const framed = ref(false);
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="framed">显示头部外框</HysCheckbox>
    <HysPageHeader title="交付单 A1702" subtitle="华东一区 · 仓库发运" :frameless="!framed" compact />
  </div>
</template>
