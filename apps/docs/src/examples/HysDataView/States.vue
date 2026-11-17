<script setup lang="ts">
import { computed, ref } from "vue";
import { HysButton, HysDataView, HysEmpty, HysSkeleton } from "hys-ui";
const waiting = ref(false);
const assets = ref<string[]>([]);
const count = computed(() => assets.value.length);
async function refresh() {
  waiting.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 650));
    assets.value = ["发布清单.pdf", "回滚手册.md", "交付记录.xlsx"];
  } finally {
    waiting.value = false;
  }
}
</script>

<template>
  <HysDataView :items="assets" :loading="waiting" default-view="grid">
    <template #toolbar>
      <div class="demo-row">
        <HysButton
          variant="secondary"
          size="sm"
          :loading="waiting"
          @click="refresh"
          >刷新附件</HysButton
        >
        <HysButton
          variant="ghost"
          size="sm"
          :disabled="!count || waiting"
          @click="assets = []"
          >清空示例</HysButton
        >
      </div>
    </template>
    <template #empty><HysEmpty description="当前项目还没有附件" /></template>
    <template #loading
      ><HysSkeleton loading-text="正在同步附件" :lines="2"
    /></template>
  </HysDataView>
</template>
