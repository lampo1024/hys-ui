<script setup lang="ts">
import { ref } from "vue";
import { HysCronEditor } from "hys-ui";

const expression = ref("0 8-18 * * MON-FRI");
const previewFrom = new Date("2026-11-13T18:00:00+08:00");
</script>

<template>
  <div class="demo-stack">
    <HysCronEditor v-model="expression" default-mode="fields" time-zone="Asia/Shanghai"
      :show-format-selector="false" :preview-count="4" :preview-from="previewFrom" />
    <p class="scenario-note">当前任务在周一至周五的 08:00 至 18:00 整点运行。选中「分钟」，用「固定值」将 0 改为 30，再应用字段。下方时间会随之更新。</p>
  </div>
</template>
