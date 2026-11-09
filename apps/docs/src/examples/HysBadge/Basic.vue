<script setup lang="ts">
import { ref } from "vue";
import { HysBadge } from "hys-ui";
const events = ref("");
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysBadge tone="blue">进行中</HysBadge
      ><HysBadge tone="green">已完成</HysBadge
      ><HysBadge tone="orange">待处理</HysBadge
      ><HysBadge tone="red">风险</HysBadge
      ><HysBadge tone="purple">评审中</HysBadge
      ><HysBadge tone="gray">已关闭</HysBadge>
    </div>
    <output v-if="events" aria-live="polite">{{ events }}</output>
  </div>
</template>
