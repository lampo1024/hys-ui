<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysTabs,
  type HysTabItem,
  type HysTabLoadContext,
  type HysTabsInstance,
  type HysTabValue,
} from "hys-ui";
const tabs = ref<HysTabsInstance>(),
  value = ref<HysTabValue>("overview"),
  fail = ref(true),
  destroy = ref(false),
  hint = ref("尚未请求报表");
let version = 0;
function load({ signal }: HysTabLoadContext) {
  return new Promise<string>((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      if (fail.value) {
        fail.value = false;
        reject(new Error("报表服务暂不可用"));
      } else resolve("报表版本 " + ++version + " 已加载，包含 36 条记录。");
    }, 650);
    function cancel() {
      clearTimeout(timer);
      reject(signal.reason);
    }
    signal.addEventListener("abort", cancel, { once: true });
  });
}
const items: HysTabItem[] = [
  {
    value: "overview",
    label: "概览",
    content: "可以预加载报表，或切换后再发起请求。",
  },
  { value: "report", label: "异步报表", load },
  { value: "empty", label: "空记录" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="fail" label="下次加载模拟失败" />
      <HysCheckbox v-model="destroy" label="离开后销毁面板" />
    </div>
    <div class="demo-panel">
      <HysTabs
        ref="tabs"
        v-model="value"
        :items="items"
        :destroy-on-hide="destroy"
        :cache-limit="2"
        animation="slide"
        @load-start="hint = '正在请求报表'"
        @load="hint = '报表内容已就绪'"
        @load-error="hint = '加载失败，可以切换到报表并重试'"
      />
    </div>
    <div class="demo-control-actions">
      <HysButton variant="secondary" @click="tabs?.preload('report')"
        >预加载报表</HysButton
      >
      <HysButton variant="ghost" @click="tabs?.reload('report')"
        >刷新报表</HysButton
      >
    </div>
    <output class="state-output" aria-live="polite">{{ hint }}</output>
  </div>
</template>
