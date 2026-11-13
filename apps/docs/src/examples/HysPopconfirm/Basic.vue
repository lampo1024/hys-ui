<script setup lang="ts">
import { nextTick, ref } from "vue";
import { HysButton, HysPopconfirm } from "hys-ui";
const archived = ref(false);
const feedback = ref("项目处于启用状态");
const restoreButton = ref<InstanceType<typeof HysButton>>();
async function archive() {
  archived.value = true;
  feedback.value = "季度报告已归档";
  await nextTick();
  restoreButton.value?.focus();
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-panel demo-control-actions">
      <HysPopconfirm
        title="归档季度报告？"
        description="归档后，报告会移出当前工作区。你可以随时恢复。"
        confirm-text="归档报告"
        :disabled="archived"
        @confirm="archive"
        @cancel="feedback = '已取消归档'"
      >
        <HysButton :disabled="archived">归档季度报告</HysButton>
      </HysPopconfirm>
      <HysButton
        v-if="archived"
        ref="restoreButton"
        variant="secondary"
        @click="
          archived = false;
          feedback = '季度报告已恢复';
        "
      >
        恢复报告
      </HysButton>
    </div>
    <output class="state-output" aria-live="polite">{{ feedback }}</output>
  </div>
</template>
