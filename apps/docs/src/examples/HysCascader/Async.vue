<script setup lang="ts">
import { ref } from "vue";
import {
  HysCascader,
  HysCheckbox,
  type HysCascaderDataNode,
  type HysCascaderLoadContext,
} from "hys-ui";
const options: HysCascaderDataNode[] = [
    { value: "cn", label: "中国", isLeaf: false },
  ],
  value = ref<string[]>([]),
  fail = ref(false),
  calls = ref(0),
  cancelled = ref(0);
function load(
  node: HysCascaderDataNode,
  ctx: HysCascaderLoadContext<HysCascaderDataNode>,
) {
  calls.value++;
  return new Promise<readonly HysCascaderDataNode[]>((resolve, reject) => {
    const abort = () => {
        clearTimeout(timer);
        cancelled.value++;
        reject(new DOMException("Aborted", "AbortError"));
      },
      timer = setTimeout(() => {
        ctx.signal.removeEventListener("abort", abort);
        if (fail.value) {
          fail.value = false;
          reject(Error("暂时不可用"));
          return;
        }
        resolve(
          node.value === "cn"
            ? [{ value: "east", label: "华东", isLeaf: false }]
            : [
                { value: "sh", label: "上海", isLeaf: true },
                { value: "hz", label: "杭州", isLeaf: true },
              ],
        );
      }, 350);
    ctx.signal.addEventListener("abort", abort, { once: true });
  });
}
</script>
<template>
  <div>
    <div class="demo-controls">
      <HysCheckbox v-model="fail">下次加载失败</HysCheckbox>
    </div>
    <div class="demo-content">
      <HysCascader
        v-model="value"
        :options="options"
        :load-children="load"
        clearable
        filterable
      />
    </div>
    <output class="state-output"
      >{{ value }} · 请求 {{ calls }} 次 · 取消 {{ cancelled }} 次</output
    >
    <p class="scenario-note">
      点击“中国”加载区域，再加载城市。关闭弹层会取消未完成请求；失败时可在原节点重试，已加载的子项会保留。搜索覆盖已经加载的路径。
    </p>
  </div>
</template>
