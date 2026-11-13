<script setup lang="ts">
import { onBeforeUnmount, onDeactivated, ref, shallowRef } from "vue";
import {
  HysButton,
  HysSpin,
  hysSpin,
  provideHysSpin,
  useHysSpin,
  type HysSpinHandle,
} from "hys-ui";
provideHysSpin({
  defaults: { color: "#6554d8" },
  presets: {
    sync: {
      animation: "draw",
      path: "M5 24h9l5-12 8 24 5-12h11",
      animationDuration: 1200,
    },
  },
});
const local = useHysSpin();
const handle = shallowRef<HysSpinHandle>();
const localArea = ref<HTMLElement>();
const state = ref("等待调用");
async function global() {
  handle.value?.close();
  const current = hysSpin.show({
    message: "正在准备工作区",
    mode: "fullscreen",
    autoEnd: 2200,
    cancellable: true,
    escapeCancel: true,
  });
  handle.value = current;
  state.value = "已创建全屏加载";
  await current.closed;
  state.value = "全屏加载已关闭";
}
async function task() {
  if (!localArea.value) return;
  state.value = "正在执行局部服务任务";
  try {
    await local.run(
      ({ signal, update }) =>
        new Promise<void>((resolve, reject) => {
          update({ progress: 60, stage: "整理数据" });
          const abort = () => {
            clearTimeout(timer);
            reject(signal.reason);
          };
          const timer = setTimeout(() => {
            signal.removeEventListener("abort", abort);
            resolve();
          }, 1100);
          signal.addEventListener("abort", abort, { once: true });
        }),
      {
        mode: "overlay",
        appendTo: localArea.value,
        title: "局部服务",
        cancellable: true,
        escapeCancel: true,
        progressType: "line",
      },
    );
    state.value = "任务完成";
  } catch {
    state.value = "任务已取消";
  }
}
function cleanup() {
  handle.value?.close();
}
onDeactivated(cleanup);
onBeforeUnmount(cleanup);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-panel">
      <HysSpin
        preset="sync"
        size="lg"
        layout="right"
        title="同步检查"
        description="项目预设与自定义文案"
      >
        <template #message>正在核对 <strong>12 项设置</strong></template>
      </HysSpin>
    </div>
    <div ref="localArea" class="demo-panel spin-service-target">
      <strong>区域同步</strong>
      <span class="hint">服务任务只覆盖这一块内容。</span>
    </div>
    <div class="demo-control-actions">
      <HysButton @click="global">全局显示 2.2 秒</HysButton>
      <HysButton variant="secondary" @click="task">运行服务任务</HysButton>
    </div>
    <output class="state-output">{{ state }}</output>
  </div>
</template>

<style scoped>
.spin-service-target {
  display: grid;
  gap: 5px;
  min-block-size: 90px;
  align-content: center;
}
</style>
