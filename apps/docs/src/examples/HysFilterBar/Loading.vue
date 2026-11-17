<script setup lang="ts">
import { ref } from "vue";
import {
  HysCheckbox,
  HysFilterBar,
  type HysFilterField,
  type HysFilterValues,
} from "hys-ui";
const fields: HysFilterField[] = [
  {
    key: "query",
    label: "资料名称",
    type: "text",
    placeholder: "输入名称后按 Enter",
  },
];
const loading = ref(false);
const disabled = ref(false);
const result = ref("等待查询");
async function search(value: HysFilterValues) {
  loading.value = true;
  try {
    await new Promise((resolve) => setTimeout(resolve, 600));
    const keyword = String(value.query ?? "").trim();
    const results = ["安全检查单", "交付说明", "发票归档指南"].filter((item) =>
      item.includes(keyword),
    );
    result.value = results.length ? results.join("、") : "没有匹配资料";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="disabled">锁定筛选条件</HysCheckbox>
    <HysFilterBar
      :fields="fields"
      :loading="loading"
      :disabled="disabled"
      @search="search"
      @reset="result = '等待查询'"
    />
    <span role="status">{{ loading ? "正在核对资料" : result }}</span>
  </div>
</template>
