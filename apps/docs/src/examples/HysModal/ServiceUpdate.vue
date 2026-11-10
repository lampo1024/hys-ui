<script setup lang="ts">
import { h, ref } from "vue";
import { HysButton, HysProgress, useHysModal } from "hys-ui";
const dialogs = useHysModal(),
  result = ref("尚未导出");
async function start() {
  const progress = ref(0),
    item = dialogs.show({
      title: "准备导出",
      content: () => h(HysProgress, { value: progress.value }),
      showCancel: true,
      confirmDisabled: true,
      okText: "完成",
    });
  const timer = setInterval(() => {
    progress.value = Math.min(100, progress.value + 20);
    if (progress.value === 100) {
      clearInterval(timer);
      item.update({
        title: "导出完成",
        confirmDisabled: false,
        showCancel: false,
        content: "文件已准备完成，可以继续操作。",
      });
    }
  }, 300);
  try {
    const answer = await item.closed;
    result.value = answer.action === "confirm" ? "已完成导出" : "已取消导出";
  } finally {
    clearInterval(timer);
  }
}
</script>
<template>
  <div class="demo-content">
    <HysButton @click="start">动态更新任务弹窗</HysButton>
  </div>
  <p class="state-output">{{ result }}</p>
</template>
