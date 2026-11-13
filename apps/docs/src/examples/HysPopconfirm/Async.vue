<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysPopconfirm,
  type HysPopconfirmActionContext,
} from "hys-ui";

const failNext = ref(true),
  allowCancel = ref(true),
  result = ref("尚未提交");
function publish({ signal }: HysPopconfirmActionContext) {
  const fail = failNext.value;
  failNext.value = false;
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      if (fail) reject(new Error("发布服务暂时不可用"));
      else resolve("公告已发布到工作区");
    }, 950);
    function abort() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", abort, { once: true });
  });
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls demo-control-actions">
      <HysCheckbox v-model="failNext" label="下次提交模拟失败" />
      <HysCheckbox v-model="allowCancel" label="处理中允许取消" />
    </div>
    <div class="demo-panel demo-control-actions">
      <HysPopconfirm
        title="发布系统公告？"
        description="所有工作区成员都能看到这条公告。"
        tone="info"
        confirm-text="确认发布"
        pending-text="正在发布"
        error-text="发布服务暂时不可用，请再次确认以重试。"
        :allow-cancel-while-pending="allowCancel"
        :action="publish"
        @error="result = '发布失败，等待重试'"
        @confirm="result = String($event)"
        @cancel="result = '已取消发布'"
      >
        <HysButton>发布公告</HysButton>
      </HysPopconfirm>
    </div>
    <output class="state-output" aria-live="polite">{{ result }}</output>
  </div>
</template>
