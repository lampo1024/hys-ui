<script setup lang="ts">
import { ref } from "vue";
import { HysAutocomplete, HysBadge, type HysAutocompleteFetch } from "hys-ui";
const email = ref(""),
  tag = ref(""),
  tags = ref<string[]>([]);
const suffixes: HysAutocompleteFetch = (query) =>
  query && !query.includes("@")
    ? ["@example.test", "@mail.test", "@work.test"]
    : [];
function add(_item: unknown, value: string) {
  if (value && !tags.value.includes(value)) tags.value.push(value);
}
</script>
<template>
  <div class="demo-content">
    <div class="autocomplete-demo-grid">
      <label class="autocomplete-demo-field"
        ><span>在当前输入后追加</span
        ><HysAutocomplete
          v-model="email"
          :fetch-suggestions="suffixes"
          :debounce="0"
          :trigger-on-focus="false"
          append
          placeholder="输入邮箱前半部分" /></label
      ><label class="autocomplete-demo-field"
        ><span>选择后清空，保留焦点</span
        ><HysAutocomplete
          v-model="tag"
          :options="['设计', '研发', '测试']"
          clear-after-select
          select-when-unmatched
          placeholder="选择或输入标签"
          @select="add"
      /></label>
    </div>
    <div class="demo-row">
      <HysBadge v-for="item in tags" :key="item">{{ item }}</HysBadge>
    </div>
    <output
      >邮箱：{{ email || "未输入" }} · 标签：{{
        tags.join("、") || "无"
      }}</output
    >
    <p class="scenario-note">
      append 追加建议的值；clearAfterSelect 清空模型但保留 select
      返回的完整值。需要选择后失焦时可启用 blurAfterSelect。
    </p>
  </div>
</template>
