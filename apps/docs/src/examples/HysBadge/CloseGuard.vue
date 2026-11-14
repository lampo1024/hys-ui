<script setup lang="ts">
import { ref } from "vue";
import { HysBadge, HysButton, HysCheckbox } from "hys-ui";
const visible = ref(true),
  locked = ref(true),
  message = ref("");
async function beforeClose() {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (locked.value) message.value = "解除锁定后可移除标签。";
  return !locked.value;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="locked" label="锁定审核标签" />
      <HysButton
        v-if="!visible"
        size="sm"
        variant="secondary"
        @click="
          visible = true;
          message = '';
        "
        >恢复标签</HysButton
      >
    </div>
    <div v-if="visible">
      <HysBadge
        closable
        :before-close="beforeClose"
        @close="
          visible = false;
          message = '';
        "
        >待审核</HysBadge
      >
    </div>
    <output v-if="message" class="state-output" aria-live="polite">{{
      message
    }}</output>
  </div>
</template>
