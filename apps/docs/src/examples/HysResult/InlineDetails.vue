<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysResult } from "hys-ui";

const resolved = ref(false);
const detailsOpen = ref(false);

function retry() {
  resolved.value = true;
  detailsOpen.value = false;
}
</script>

<template>
  <div class="result-preview">
    <HysResult
      v-model:details-open="detailsOpen"
      layout="inline"
      :heading-level="3"
      :status="resolved ? 'success' : 'warning'"
      :title="resolved ? '报表已同步' : '报表尚未同步'"
      :subtitle="
        resolved
          ? '可在经营报表中查看最新数据。'
          : '上次同步遇到连接超时，可重新同步。'
      "
      details-label="同步记录"
      announce="polite"
    >
      <template #details>
        <p class="sync-detail">
          任务编号 RP-2417 · {{ resolved ? "已完成" : "等待重试" }}
        </p>
      </template>
      <template v-if="!resolved" #extra>
        <HysButton size="sm" variant="secondary" @click="retry"
          >重新同步</HysButton
        >
      </template>
    </HysResult>
  </div>
</template>

<style scoped>
.result-preview {
  border: 1px solid var(--docs-border);
  border-radius: 10px;
}
.sync-detail {
  margin: 0;
}
</style>
