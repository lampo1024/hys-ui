<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysModal,
  type HysModalActionContext,
} from "hys-ui";
const open = ref(false),
  fail = ref(true),
  attempts = ref(0),
  result = ref("等待保存");
async function save({ signal }: HysModalActionContext) {
  attempts.value++;
  await new Promise<void>((resolve) => setTimeout(resolve, 900));
  if (signal.aborted) return false;
  if (fail.value) {
    fail.value = false;
    throw new Error("模拟网络错误");
  }
  result.value = "保存完成";
}
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="fail" label="下一次模拟失败" /><HysButton
      @click="open = true"
      >异步保存</HysButton
    >
  </div>
  <p class="state-output">{{ result }} · 已提交 {{ attempts }} 次</p>
  <HysModal
    v-model:open="open"
    title="保存修改"
    footer
    close-while-confirming
    :before-confirm="save"
    error-text="保存失败，请检查连接后重试。"
    ok-text="保存修改"
  >
    <p>
      确认按钮等待请求完成，阻止重复提交。失败会保留内容并显示错误，再次确认即可重试；取消会中止本次操作的信号。
    </p>
  </HysModal>
</template>
