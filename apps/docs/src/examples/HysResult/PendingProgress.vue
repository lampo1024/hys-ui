<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysResult } from "hys-ui";
const progress = ref(35);
</script>

<template>
  <HysResult
    layout="inline"
    :status="progress < 100 ? 'pending' : 'success'"
    :title="progress < 100 ? '正在校验数据' : '数据校验完成'"
    :progress="progress"
    :heading-level="3"
  >
    <template #extra>
      <HysButton
        v-if="progress < 100"
        size="sm"
        variant="secondary"
        @click="progress = Math.min(100, progress + 35)"
        >推进校验</HysButton
      >
    </template>
  </HysResult>
</template>
