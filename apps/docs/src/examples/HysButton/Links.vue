<script setup lang="ts">
import { ref } from "vue";
import { HysButton } from "hys-ui";
const feedback = ref("");
</script>

<template>
  <div class="button-link-demo">
    <div class="demo-row">
      <HysButton type="primary" link href="#api">查看 API</HysButton>
      <HysButton type="primary" link href="#api" disabled>禁用链接</HysButton>
      <HysButton type="primary" text @click="feedback = '已展开详情'">详情</HysButton>
      <HysButton type="primary" text bg @click="feedback = '已加入收藏'">收藏</HysButton>
    </div>
    <small v-if="feedback" role="status">{{ feedback }}</small>
  </div>
</template>

<style scoped>
.button-link-demo { display: grid; gap: 8px; }
</style>
