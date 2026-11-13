<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysSelect, HysSpin, type HysSpinTaskContext } from "hys-ui";
const spin = ref<InstanceType<typeof HysSpin>>();
const kind = ref<"ring" | "line" | "segments">("segments"),
  result = ref("等待执行");
const types = [
  { label: "进度环", value: "ring" },
  { label: "线性", value: "line" },
  { label: "分段", value: "segments" },
];
function sleep(milliseconds: number, signal: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal.aborted) return reject(signal.reason);
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      resolve();
    }, milliseconds);
    signal.addEventListener("abort", abort, { once: true });
  });
}
function run(fail: boolean, timeout?: number) {
  result.value = "任务已启动";
  void spin.value
    ?.run(
      async ({ signal, attempt, update }: HysSpinTaskContext) => {
        for (let index = 0; index <= 8; index++) {
          update({
            progress: (index / 8) * 100,
            stage: index < 3 ? "准备文件" : "校验记录",
            remainingTime: (8 - index) * 190,
          });
          await sleep(190, signal);
          if (fail && attempt === 1 && index === 3)
            throw new Error("校验服务暂不可用");
        }
        return 48;
      },
      { timeout, initial: { progress: 0, message: "正在同步报表" } },
    )
    .then(
      (count) => {
        result.value = "已同步 " + count + " 条记录";
      },
      () => {},
    );
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <label class="demo-field"
        >进度样式<HysSelect
          v-model="kind"
          :options="types"
          aria-label="进度样式"
      /></label>
    </div>
    <div class="demo-control-actions">
      <HysButton @click="run(false)">同步报表</HysButton>
      <HysButton variant="secondary" @click="run(true)">模拟失败</HysButton>
      <HysButton variant="secondary" @click="run(false, 650)"
        >模拟超时</HysButton
      >
      <HysButton variant="ghost" @click="spin?.clearResult()"
        >清除结果</HysButton
      >
    </div>
    <div class="demo-panel">
      <HysSpin
        ref="spin"
        :default-spinning="false"
        mode="block"
        region-height="126px"
        :progress-type="kind"
        title="月度报表"
        show-result
        cancellable
        retryable
        @error="result = '同步失败，可点击重试'"
        @cancel="result = '已取消'"
        @timeout="result = '任务超时'"
        @retry="result = '正在重试'"
        @success="result = '同步完成'"
      />
    </div>
    <output class="state-output">{{ result }}</output>
  </div>
</template>
