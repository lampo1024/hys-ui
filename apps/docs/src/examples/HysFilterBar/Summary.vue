<script setup lang="ts">
import { ref } from "vue";
import {
  HysFilterBar,
  type HysFilterField,
  type HysFilterValues,
} from "hys-ui";
const fields: HysFilterField[] = [
  { key: "name", type: "text", label: "资料名称" },
  { key: "pages", type: "number", label: "至少页数", min: 0 },
  {
    key: "notes",
    type: "boolean",
    label: "附有核对备注",
    checkLabel: "仅有备注",
  },
];
const draft = ref<HysFilterValues>({ name: "发运", pages: 0, notes: true });
const result = ref("等待查询");
function show(value: HysFilterValues) {
  result.value =
    [
      value.name ? "名称包含 " + value.name : "",
      value.pages != null ? "至少 " + value.pages + " 页" : "",
      value.notes ? "仅有备注" : "",
    ]
      .filter(Boolean)
      .join(" · ") || "全部资料";
}
</script>
<template>
  <div class="demo-stack">
    <HysFilterBar
      v-model:values="draft"
      :fields="fields"
      :collapsed-count="1"
      show-summary
      @search="show"
      @reset="show"
    />
    <small>条件摘要包含折叠字段，移除后可点击查询应用。</small>
    <span role="status">{{ result }}</span>
  </div>
</template>
