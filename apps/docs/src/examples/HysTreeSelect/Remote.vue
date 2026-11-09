<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, HysCheckbox, type HysTreeSelectNode } from "hys-ui";
const value = ref(""),
  fail = ref(false),
  requests = ref(0);
const members = [
  { value: "keller", label: "Keller · 平台研发" },
  { value: "lisa", label: "Lisa · 平台研发" },
  { value: "david", label: "David · 质量保障" },
  { value: "amy", label: "Amy · 体验设计" },
];
function search(
  query: string,
  { signal }: { signal: AbortSignal },
): Promise<HysTreeSelectNode[]> {
  requests.value++;
  return new Promise((resolve, reject) => {
    const cancel = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", cancel);
      if (fail.value) {
        reject(new Error("演示网络错误"));
        return;
      }
      const children = members.filter((member) =>
        member.label.toLowerCase().includes(query.toLowerCase()),
      );
      resolve(
        children.length ? [{ value: "team", label: "团队成员", children }] : [],
      );
    }, 280);
    signal.addEventListener("abort", cancel, { once: true });
    if (signal.aborted) cancel();
  });
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="fail" label="模拟请求失败" /><HysTreeSelect
      v-model="value"
      :nodes="[]"
      remote
      :remote-method="search"
      :debounce="180"
      leaf-only
      clearable
      placeholder="搜索远程成员"
    /><output>选中：{{ value || "无" }} · 请求次数：{{ requests }}</output>
    <p class="scenario-note">
      快速输入会取消旧请求；关闭弹层后忽略过期结果。已选项的名称会保留，失败时可以重试。
    </p>
  </div>
</template>
