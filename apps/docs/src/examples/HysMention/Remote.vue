<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysMention, type HysMentionLoadContext } from "hys-ui";

const text = ref("");
const fail = ref(false);
const people = [
  { value: "lina", label: "林娜 · 研发" },
  { value: "liang", label: "梁旭 · 设计" },
  { value: "zhou", label: "周宁 · 质量" },
];
function loadOptions({ query, signal }: HysMentionLoadContext) {
  return new Promise<typeof people>((resolve, reject) => {
    const abort = () => {
      clearTimeout(timer);
      reject(signal.reason);
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      if (fail.value) reject(new Error("暂时无法获取成员"));
      else
        resolve(
          people.filter(
            ({ value, label }) =>
              value.includes(query.toLowerCase()) || label.includes(query),
          ),
        );
    }, 360);
    signal.addEventListener("abort", abort, { once: true });
  });
}
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="fail">模拟候选请求失败</HysCheckbox>
    <HysMention
      v-model="text"
      type="text"
      :load-options="loadOptions"
      :min-query-length="1"
      placeholder="输入 @l 搜索成员"
      not-found-text="找不到相关成员"
    />
    <p class="scenario-note">
      快速输入会取消上一条请求。遇到错误时，关闭模拟失败后可点击重试，也可在输入框按
      Enter 重试。
    </p>
  </div>
</template>
