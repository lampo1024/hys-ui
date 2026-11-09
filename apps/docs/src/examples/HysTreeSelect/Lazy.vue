<script setup lang="ts">
import { ref } from "vue";
import {
  HysTreeSelect,
  HysCheckbox,
  type HysTreeSelectNode,
  type HysTreeLoadContext,
} from "hys-ui";
const value = ref("future"),
  fail = ref(false),
  requests = ref(0);
const nodes: HysTreeSelectNode[] = [
    { value: "root", label: "研发中心", hasChildren: true },
  ],
  cacheData: HysTreeSelectNode[] = [
    { value: "future", label: "待加载的团队成员" },
  ];
function load(
  node: HysTreeSelectNode,
  { signal }: HysTreeLoadContext,
): Promise<HysTreeSelectNode[]> {
  requests.value++;
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      if (fail.value) reject(Error("加载失败"));
      else
        resolve([
          { value: "future", label: "平台研发团队", isLeaf: true },
          { value: node.value + "-qa", label: "质量保障团队", isLeaf: true },
        ]);
    }, 350);
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) cancel();
  });
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="fail" label="模拟加载失败" /><HysTreeSelect
      v-model="value"
      :nodes="nodes"
      :cache-data="cacheData"
      :load-children="load"
      :default-expand-all="false"
      leaf-only
      clearable
    /><output>选中：{{ value || "无" }} · 加载次数：{{ requests }}</output>
    <p class="scenario-note">
      展开分支后加载子节点，缓存标签可在加载前回显。失败可重试，关闭弹层会取消未完成请求，已完成的数据可复用。
    </p>
  </div>
</template>
