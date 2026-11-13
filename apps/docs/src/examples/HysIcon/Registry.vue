<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysIcon,
  createHysIconRegistry,
  provideHysIcons,
  type HysIconLibrary,
} from "hys-ui";
const registry = createHysIconRegistry();
provideHysIcons({ registry, defaults: { size: "lg" } });
const chosen = ref("team:trend"),
  message = ref("等待操作"),
  loaded = ref(false);
const loader = async () => {
  await new Promise((resolve) => setTimeout(resolve, 480));
  return import("./lazyMetric");
};
const initial: HysIconLibrary = {
  namespace: "team",
  version: "1.0",
  icons: {
    metric: {
      source: loader,
      aliases: ["trend"],
      label: "团队指标",
      category: "数据",
      keywords: ["趋势", "chart"],
    },
  },
};
registry.register(initial);
async function preload() {
  const [result] = await registry.preload(["team:metric"]);
  message.value =
    result.status === "fulfilled"
      ? "预加载完成，别名共享同一资源"
      : "预加载失败";
}
function replace() {
  registry.register(
    {
      namespace: "team",
      version: "2.0",
      icons: {
        metric: {
          aliases: ["trend"],
          label: "团队指标",
          category: "数据",
          source: {
            type: "svg",
            nodes: [
              { tag: "path", attrs: { d: "M4 18V6m0 12h16M7 15l4-5 4 2 5-6" } },
            ],
          },
        },
      },
    },
    "replace",
  );
  chosen.value = "team:trend";
  message.value = "同名资源已更新为 2.0";
}
function loadMissing() {
  chosen.value = "team:missing";
  loaded.value = false;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-panel demo-control-actions">
      <HysIcon
        :name="chosen"
        size="xl"
        label="团队图标预览"
        fallback="help"
        @load="loaded = true"
        @error="message = '未找到图标，已显示回退'"
      />
      <code>{{ chosen }}</code>
      <small
        >{{ registry.resolve(chosen)?.version || "—" }} ·
        {{ loaded ? "资源就绪" : "等待资源" }}</small
      >
    </div>
    <div class="demo-control-actions">
      <HysButton @click="preload">预加载资源</HysButton>
      <HysButton variant="secondary" @click="replace">替换为 2.0</HysButton>
      <HysButton variant="secondary" @click="loadMissing"
        >测试缺失回退</HysButton
      >
      <HysButton variant="ghost" @click="chosen = 'team:trend'"
        >恢复团队图标</HysButton
      >
    </div>
    <output class="state-output">{{ message }}</output>
  </div>
</template>
