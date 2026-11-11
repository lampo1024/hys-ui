<script setup lang="ts">
import { ref } from "vue";
import {
  HysMention,
  type HysMentionLoadContext,
  type HysMentionPage,
  type HysMentionSource,
} from "hys-ui";

const text = ref("");
const requests = ref(0);
function directory(group: string) {
  const rows = Array.from({ length: 24 }, (_, index) => ({
    value: group + "-" + (index + 1),
    label: group + " " + (index + 1),
    group,
  }));
  return async ({
    query,
    page,
    pageSize,
    signal,
  }: HysMentionLoadContext): Promise<HysMentionPage> => {
    requests.value++;
    await new Promise<void>((resolve, reject) => {
      const abort = () => {
        clearTimeout(timer);
        reject(signal.reason);
      };
      const timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        resolve();
      }, 280);
      signal.addEventListener("abort", abort, { once: true });
    });
    const filtered = rows.filter(({ label }) => label.includes(query));
    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize),
      total: filtered.length,
    };
  };
}
const sources: HysMentionSource[] = [
  { key: "members", group: "研发成员", loadOptions: directory("研发成员") },
  { key: "reviewers", group: "评审人员", loadOptions: directory("评审人员") },
];
</script>

<template>
  <div class="demo-stack">
    <HysMention
      v-model="text"
      :sources="sources"
      :page-size="5"
      :max-options="0"
      :popup-max-height="235"
      :cache="{ ttl: 30000, maxEntries: 24 }"
      :throttle="250"
      placeholder="输入 @ 后向下滚动加载"
    />
    <output class="state-output">已发起 {{ requests }} 次请求</output>
    <p class="scenario-note">
      两个来源各自分页。滚动到底部或按 Page Down 加载更多，重复查询可复用 30
      秒内的结果。
    </p>
  </div>
</template>
