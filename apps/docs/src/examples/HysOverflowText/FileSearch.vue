<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysOverflowText } from "hys-ui";
const term = ref("report");
const path = "artifacts/nightly/2026-11-18/warehouse-export-report-final.csv";
</script>

<template>
  <div class="demo-stack">
    <HysInput v-model="term" aria-label="高亮关键词" placeholder="高亮关键词" clearable />
    <HysOverflowText :text="path" :max-width="300" ellipsis="middle" :keywords="term" expandable copyable />
  </div>
</template>
