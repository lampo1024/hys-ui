<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysSteps } from "hys-ui";
const current = ref(0),
  valid = ref(false),
  hint = ref("");
async function guard(next: number) {
  if (next === 0) return true;
  await new Promise((resolve) => setTimeout(resolve, 300));
  hint.value = valid.value ? "" : "请先确认申请信息。";
  return valid.value;
}
</script>

<template>
  <div class="demo-stack">
    <HysSteps
      v-model:current="current"
      :items="['填写申请', '提交审核']"
      :before-change="guard"
      clickable
    />
    <HysCheckbox v-model="valid" label="已核对申请信息" />
    <output v-if="hint" class="state-output" aria-live="polite">{{
      hint
    }}</output>
  </div>
</template>
