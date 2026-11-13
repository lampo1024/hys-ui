<script setup lang="ts">
import { ref } from "vue";
import { HysIcon, createHysIconRegistry, hysBuiltinIcons } from "hys-ui";
const name = ref("core:search");
const builtinCount = Object.keys(hysBuiltinIcons.icons).length;
const registry = createHysIconRegistry();
registry.register({
  namespace: "product",
  version: "1.1",
  icons: {
    dashboard: {
      label: "工作台",
      category: "导航",
      aliases: ["workspace"],
      keywords: ["仪表盘", "dashboard"],
      source: {
        type: "svg",
        nodes: [
          {
            tag: "path",
            attrs: {
              d: "M3 5h8v7H3Zm10 0h8v14h-8ZM3 14h8v5H3Z",
              "stroke-linejoin": "round",
            },
          },
        ],
      },
    },
    priority: {
      label: "优先级",
      category: "状态",
      keywords: ["标记", "priority"],
      source: { type: "text", text: "▲" },
    },
  },
});
</script>

<template>
  <div class="demo-stack">
    <p class="picker-guide">
      共
      {{ builtinCount }}
      个内置图标。可按分类浏览，或搜索「折线图」「日期范围」「wifi」等关键词。选择图标后可复制名称、组件代码或
      SVG。
    </p>
    <HysIcon
      v-model:name="name"
      :registry="registry"
      picker
      allow-upload
      storage-key="hys-docs-icon-picker"
    />
    <output class="state-output picker-output"
      ><HysIcon :name="name" :registry="registry" size="sm" /> 已选择
      {{ name }}</output
    >
  </div>
</template>

<style scoped>
.picker-guide {
  margin: 0;
}

.picker-output {
  display: flex;
  align-items: center;
  gap: 8px;
  overflow-wrap: anywhere;
}
</style>
