<script setup lang="ts">
import { nextTick, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysDescriptions,
  HysResult,
  HysSpace,
  type HysButtonActionContext,
  type HysDescriptionItem,
  type HysResultInstance,
} from "hys-ui";
const result = ref<HysResultInstance>(),
  submitButton = ref<InstanceType<typeof HysButton>>();
const view = ref<"details" | "error" | "success">("details"),
  failNext = ref(true);
const fields: HysDescriptionItem[] = [
  { key: "number", label: "申请编号", value: "PU-1048" },
  { key: "owner", label: "提交团队", value: "客户交付" },
  { key: "count", label: "物料数", value: 3 },
  {
    key: "note",
    label: "采购用途",
    value: "补充客户演示和交付所需物料。",
    span: "full",
  },
];
function submit({ signal }: HysButtonActionContext) {
  const fail = failNext.value;
  failNext.value = false;
  return new Promise<"success" | "error">((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve(fail ? "error" : "success");
    }, 550);
    function abort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", abort, { once: true });
  });
}
async function display(outcome: unknown) {
  view.value = outcome === "success" ? "success" : "error";
  await nextTick();
  result.value?.focus();
}
async function back() {
  view.value = "details";
  await nextTick();
  submitButton.value?.focus();
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="failNext" label="下次提交模拟失败" />
    </div>
    <div class="workflow-preview">
      <div v-if="view === 'details'" class="workflow-form">
        <HysDescriptions
          title="采购申请"
          :items="fields"
          :columns="{ xs: 1, sm: 2, md: 3 }"
          bordered
        />
        <HysSpace block justify="end" wrap>
          <HysButton
            ref="submitButton"
            :action="submit"
            loading-text="正在提交"
            @action-success="display"
            >提交申请</HysButton
          >
        </HysSpace>
      </div>
      <HysResult
        v-else
        ref="result"
        :status="view"
        :heading-level="3"
        :title="view === 'success' ? '采购申请已提交' : '采购申请提交失败'"
        :subtitle="
          view === 'success'
            ? '申请已送审，可返回查看明细。'
            : '服务暂时不可用，原有申请信息已保留。'
        "
      >
        <div class="workflow-reference">申请编号 · PU-1048</div>
        <template #extra>
          <HysSpace justify="center" wrap>
            <HysButton
              v-if="view === 'error'"
              :action="submit"
              loading-text="正在重试"
              @action-success="display"
              >重新提交</HysButton
            >
            <HysButton variant="secondary" @click="back">返回申请</HysButton>
          </HysSpace>
        </template>
      </HysResult>
    </div>
  </div>
</template>

<style scoped>
.workflow-preview {
  border: 1px solid var(--docs-border);
  border-radius: 10px;
}
.workflow-form {
  display: grid;
  gap: 16px;
  padding: 16px;
}
.workflow-reference {
  padding: 5px 10px;
  border-radius: 6px;
  background: var(--docs-bg);
}
</style>
