<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCard, HysInput } from "hys-ui";
const loading = ref(false);
async function refresh() {
  loading.value = true;
  await new Promise((resolve) => setTimeout(resolve, 700));
  loading.value = false;
}
</script>

<template>
  <HysCard
    title="报表设置"
    :loading="loading"
    loading-text="正在刷新"
    keep-content-on-loading
  >
    <template #action
      ><HysButton
        size="sm"
        variant="secondary"
        :loading="loading"
        @click="refresh"
        >刷新</HysButton
      ></template
    >
    <HysInput default-value="华东仓日报" aria-label="报表名称" />
  </HysCard>
</template>
