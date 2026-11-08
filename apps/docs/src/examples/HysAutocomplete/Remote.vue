<script setup lang="ts">
import { ref } from "vue";
import {
  HysAutocomplete,
  HysCheckbox,
  type HysAutocompleteFetch,
  type HysAutocompleteInstance,
} from "hys-ui";
const value = ref(""),
  fail = ref(false),
  requests = ref(0),
  component = ref<HysAutocompleteInstance>();
const members = ["Alex Chen", "Lisa Lin", "David Zhou", "Amy Wang", "Jack Li"];
const fetchSuggestions: HysAutocompleteFetch = (query, _done, { signal }) =>
  new Promise((resolve, reject) => {
    requests.value++;
    const abort = () => {
      clearTimeout(timer);
      reject(new DOMException("Cancelled", "AbortError"));
    };
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", abort);
      if (fail.value) reject(new Error("示例请求失败"));
      else
        resolve(
          members
            .filter((name) => name.toLowerCase().includes(query.toLowerCase()))
            .map((name) => ({ value: name, label: name })),
        );
    }, 650);
    signal.addEventListener("abort", abort, { once: true });
  });
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysCheckbox v-model="fail" label="模拟请求失败" />
    </div>
    <label class="autocomplete-demo-field"
      ><span>远程成员搜索</span
      ><HysAutocomplete
        ref="component"
        v-model="value"
        :fetch-suggestions="fetchSuggestions"
        :debounce="250"
        :min-query-length="1"
        :trigger-on-focus="false"
        placeholder="输入 a、li 或不存在的名字"
        clearable /></label
    ><output>值：{{ value || "未输入" }} · 已发送 {{ requests }} 次请求</output>
    <p class="scenario-note">
      请求采用 250ms 防抖，模拟 650ms
      延迟。快速连续输入会取消旧请求；取消失败开关后，可点击浮层中的重试。空结果有独立提示。
    </p>
  </div>
</template>
