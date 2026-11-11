<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, type HysButtonActionContext, type HysButtonInstance } from "hys-ui";

const reject = ref(false);
const allowed = ref(true);
const feedback = ref("");
const button = ref<HysButtonInstance>();

function check() {
  if (allowed.value) return true;
  feedback.value = "请先允许保存";
  return false;
}
function cancel() {
  button.value?.cancelAction();
  feedback.value = "已取消保存";
}

function save({ signal }: HysButtonActionContext) {
  const shouldReject = reject.value;
  feedback.value = "";
  return new Promise<string>((resolve, rejectSave) => {
    const timer = setTimeout(() => {
      if (shouldReject) rejectSave(new Error("保存失败，可以重试"));
      else resolve("草稿已保存");
    }, 700);
    signal.addEventListener("abort", () => {
      clearTimeout(timer);
      rejectSave(signal.reason);
    }, { once: true });
  });
}
</script>

<template>
  <div class="button-request-demo">
    <div class="demo-row">
      <HysCheckbox v-model="reject" label="模拟保存失败" />
      <HysCheckbox v-model="allowed" label="允许保存" />
    </div>
    <div class="demo-row">
      <HysButton ref="button" :action="save" :before-action="check" :action-loading-delay="150" loading-text="正在保存" @action-success="feedback = String($event)"
        @action-error="feedback = $event instanceof Error ? $event.message : '保存失败'">
        保存草稿
      </HysButton>
      <HysButton variant="secondary" :disabled="!button?.busy" @click="cancel">取消保存</HysButton>
    </div>
    <small v-if="feedback" role="status">{{ feedback }}</small>
  </div>
</template>

<style scoped>
.button-request-demo { display: grid; gap: 10px; }
</style>
