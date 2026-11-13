<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, HysPopconfirm } from "hys-ui";
const approved = ref(false),
  result = ref("待检查备份");
function verifyBackup() {
  if (approved.value) return true;
  result.value = "请先确认备份已完成";
  return false;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-panel demo-control-actions">
      <HysPopconfirm
        title="清空历史记录？"
        tone="danger"
        confirm-text="清空记录"
        :before-confirm="verifyBackup"
        :close-on-outside="false"
        @confirm="
          result = '已清空历史记录';
          approved = false;
        "
      >
        <HysButton variant="danger" plain>清空历史记录</HysButton>
        <template #description>
          <p class="guard-copy">删除后无法恢复。请确认已有可用的备份。</p>
          <HysCheckbox v-model="approved" label="我已完成备份" />
        </template>
      </HysPopconfirm>
    </div>
    <output class="state-output" aria-live="polite">{{ result }}</output>
  </div>
</template>

<style scoped>
.guard-copy {
  margin: 0 0 8px;
}
</style>
