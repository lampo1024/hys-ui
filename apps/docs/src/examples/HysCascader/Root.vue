<script setup lang="ts">
import { ref } from "vue";
import {
  HysCascader,
  HysButton,
  type HysCascaderDataNode,
  type HysCascaderInstance,
} from "hys-ui";
const api = ref<HysCascaderInstance<HysCascaderDataNode>>(),
  value = ref(["cn", "sh"]),
  calls = ref(0),
  options: HysCascaderDataNode[] = [],
  cached: HysCascaderDataNode[] = [
    { value: "cn", label: "中国", children: [{ value: "sh", label: "上海" }] },
  ];
function loadRoot(ctx: { signal: AbortSignal }) {
  calls.value++;
  return new Promise<readonly HysCascaderDataNode[]>((resolve, reject) => {
    const abort = () => {
        clearTimeout(timer);
        reject(new DOMException("Aborted", "AbortError"));
      },
      timer = setTimeout(() => {
        ctx.signal.removeEventListener("abort", abort);
        resolve([
          {
            value: "cn",
            label: "中国",
            children: [
              { value: "sh", label: "上海" },
              { value: "hz", label: "杭州" },
            ],
          },
        ]);
      }, 400);
    ctx.signal.addEventListener("abort", abort, { once: true });
  });
}
</script>
<template>
  <div>
    <div class="demo-content">
      <HysCascader
        ref="api"
        v-model="value"
        :options="options"
        :cache-data="cached"
        :load-root="loadRoot"
        clearable
      />
    </div>
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="api?.show().then(() => api?.reloadRoot())"
        >重新加载根分类</HysButton
      >
    </div>
    <output class="state-output"
      >{{ value }} · 根数据加载 {{ calls }} 次</output
    >
    <p class="scenario-note">
      根选项按需加载，回填标签可从 cacheData
      提前读取；打开后自动定位已选路径。重新打开复用已接受的结果。
    </p>
  </div>
</template>
