<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysTag } from "hys-ui";
const visible = ref(true);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysTag tone="success" variant="solid">已审批</HysTag>
      <HysTag tone="warning" variant="outline">待核对</HysTag>
      <HysTag v-if="visible" tone="danger" closable @close="visible = false">数据异常</HysTag>
      <HysButton v-else variant="secondary" size="sm" @click="visible = true">恢复异常标签</HysButton>
    </div>
  </div>
</template>
