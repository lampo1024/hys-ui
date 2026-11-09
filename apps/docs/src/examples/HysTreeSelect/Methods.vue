<script setup lang="ts">
import { ref } from "vue";
import { HysTreeSelect, HysButton, type HysTreeSelectInstance } from "hys-ui";
const api = ref<HysTreeSelectInstance>(),
  value = ref(""),
  output = ref("");
const nodes = [
  {
    value: "docs",
    label: "项目资料",
    children: [
      { value: "guide", label: "使用指南" },
      { value: "api", label: "接口文档" },
    ],
  },
];
function read() {
  output.value = JSON.stringify(
    {
      keys: api.value?.getSelectedKeys(),
      items: api.value
        ?.getSelectedItems()
        .map((item) => ({ value: item.value, label: item.label })),
      expanded: api.value?.getExpandedKeys(),
    },
    null,
    2,
  );
}
</script>
<template>
  <div class="demo-stack">
    <HysTreeSelect
      ref="api"
      v-model="value"
      :nodes="nodes"
      :default-expand-all="false"
      clearable
    />
    <div class="demo-actions">
      <HysButton size="sm" @click="api?.show()">展开并聚焦</HysButton
      ><HysButton size="sm" variant="secondary" @click="api?.setValue('api')"
        >设置接口文档</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="api?.scrollTo({ key: 'guide' })"
        >定位使用指南</HysButton
      ><HysButton size="sm" variant="secondary" @click="read"
        >读取状态</HysButton
      ><HysButton size="sm" variant="secondary" @click="api?.clear()"
        >清空</HysButton
      >
    </div>
    <output>{{ output || `选中：${value || "无"}` }}</output>
  </div>
</template>
