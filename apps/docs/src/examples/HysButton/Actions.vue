<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref } from "vue";
import { Check, Hourglass } from "lucide-vue-next";
import { HysButton } from "hys-ui";

const saving = ref(false);
const feedback = ref("");
let timer: ReturnType<typeof setTimeout> | undefined;
function save() {
  saving.value = true;
  feedback.value = "";
  timer = setTimeout(() => {
    saving.value = false;
    feedback.value = "已保存";
  }, 900);
}
function cancel() {
  clearTimeout(timer);
  saving.value = false;
}
onBeforeUnmount(cancel);
onDeactivated(cancel);
</script>

<template>
  <div class="button-actions-demo">
    <div class="demo-row">
      <HysButton auto-insert-space :loading="saving ? { delay: 180 } : false" :loading-icon="Hourglass" @click="save">保存</HysButton>
      <HysButton tag="span" variant="text" bg :icon="Check" @click="feedback = ''">重置提示</HysButton>
      <HysButton danger ghost shape="round" :disabled="saving" @click="feedback = '已移除草稿'">移除草稿</HysButton>
    </div>
    <small v-if="feedback" role="status">{{ feedback }}</small>
  </div>
</template>

<style scoped>
.button-actions-demo { display: grid; gap: 8px; }
</style>
