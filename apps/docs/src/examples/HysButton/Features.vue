<script setup lang="ts">
import { Check, Download, Search } from "lucide-vue-next";
import { HysButton } from "hys-ui";
</script>

<template>
  <div class="button-feature-demo">
    <div class="demo-row">
      <HysButton size="small" type="default">小号</HysButton>
      <HysButton size="default" type="default">默认</HysButton>
      <HysButton size="large" type="default">大号</HysButton>
    </div>
    <div class="demo-row">
      <HysButton type="success" :icon="Check">完成</HysButton>
      <HysButton type="primary" icon-position="right">
        <template #icon><Download :size="16" /></template>
        下载
      </HysButton>
      <HysButton :icon="Search" circle aria-label="搜索" />
      <HysButton type="primary" round plain>圆角</HysButton>
      <HysButton type="default" dashed>添加</HysButton>
    </div>
  </div>
</template>

<style scoped>
.button-feature-demo { display: grid; gap: 12px; }
</style>
