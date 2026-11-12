<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref } from "vue";
import { HysButton, useHysToast } from "hys-ui";

const toast = useHysToast({ position: "bottom-right", maxCount: 3 });
const result = ref("");
let job: AbortController | undefined;
function cancel() {
  job?.abort();
}
onDeactivated(cancel);
onBeforeUnmount(cancel);
function wait(signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, 140);
    signal.addEventListener("abort", abort, { once: true });
  });
}
function transfer(label: string, fail = false) {
  cancel();
  const controller = (job = new AbortController());
  const task = toast.promise(
    async ({ progress }) => {
      for (let value = 0; value <= 100; value += 10) {
        progress(value);
        await wait(controller.signal);
        if (fail && value === 40) throw new Error("连接超时");
      }
      return "月度报表.pdf";
    },
    {
      id: "transfer",
      loading: {
        title: label,
        message: "月度报表.pdf",
        progress: 0,
        swipe: true,
        onClose: () => controller.abort(),
      },
      success: (name) => ({
        title: label + "完成",
        message: name,
        duration: 4000,
      }),
      error: (error) => ({
        title: label + "失败",
        message: error instanceof Error ? error.message : "请稍后再试",
        duration: 0,
        actions: [
          {
            id: "retry",
            label: "重试",
            closeOnSuccess: false,
            run: () => transfer(label),
          },
        ],
      }),
    },
  );
  void task.promise.then(
    (name) => {
      if (!controller.signal.aborted) result.value = label + "完成 · " + name;
    },
    () => {
      if (!controller.signal.aborted)
        result.value = "模拟网络失败，可在提示中重试。";
    },
  );
}
function save() {
  const task = toast.promise(async () => "筛选条件", {
    loading: "正在提交表单…",
    success: (item) => ({
      title: "已保存",
      message: item,
      duration: 6000,
      actions: [
        {
          id: "undo",
          label: "撤销",
          run: async () => {
            await Promise.resolve();
            result.value = "已撤销对" + item + "的修改。";
            toast.info("已撤销保存");
          },
        },
      ],
    }),
  });
  void task.promise.catch(() => {});
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="transfer('上传')">模拟上传</HysButton>
      <HysButton variant="secondary" @click="transfer('下载')"
        >模拟下载</HysButton
      >
      <HysButton variant="secondary" @click="transfer('上传', true)"
        >模拟网络失败</HysButton
      >
      <HysButton variant="secondary" @click="save">保存表单</HysButton>
      <HysButton
        variant="secondary"
        @click="
          toast.success({
            title: '批量操作完成',
            message: '已归档 18 条记录，2 条记录需要人工核对。',
            copyable: true,
          })
        "
        >批量反馈</HysButton
      >
    </div>
    <output class="state-output">{{
      result || "上传和下载更新同一条进度提示。失败后可重试，保存后可撤销。"
    }}</output>
  </div>
</template>
