<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysInput,
  HysModal,
  useHysModal,
  type HysModalCloseReason,
  type HysModalActionContext,
} from "hys-ui";
const open = ref(false),
  text = ref(""),
  saved = ref(""),
  dialogs = useHysModal();
async function beforeClose(
  reason: HysModalCloseReason,
  { signal }: HysModalActionContext,
) {
  if (reason === "confirm" || text.value === saved.value) return;
  const question = dialogs.confirm({
    title: "放弃尚未保存的修改？",
    content: "关闭后，当前草稿不会保存。",
    okText: "放弃修改",
    okVariant: "danger",
    initialFocus: "cancel",
  });
  const abort = () => question.destroy();
  signal.addEventListener("abort", abort, { once: true });
  try {
    const result = await question.closed;
    if (result.action !== "confirm") return false;
    text.value = saved.value;
  } finally {
    signal.removeEventListener("abort", abort);
  }
}
</script>
<template>
  <div class="demo-content">
    <HysButton @click="open = true">编辑并检查关闭</HysButton>
  </div>
  <p class="state-output">已保存：{{ saved || "空" }}</p>
  <HysModal
    v-model:open="open"
    title="编辑备注"
    footer
    :before-close="beforeClose"
    @ok="saved = text"
  >
    <HysInput v-model="text" placeholder="修改后尝试取消或按 Esc" />
    <p>有未保存内容时，使用另一层确认弹窗决定是否放弃。</p>
  </HysModal>
</template>
