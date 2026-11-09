<script setup lang="ts">
import { ref } from "vue";
import { HysTree, HysSelect, HysCheckbox } from "hys-ui";
const query = ref("平台"),
  mode = ref<"hide" | "highlight">("hide"),
  children = ref(false);
const nodes = [
  {
    id: "research",
    label: "研发中心",
    children: [
      {
        id: "platform",
        label: "平台团队",
        children: [
          { id: "api", label: "接口服务" },
          { id: "web", label: "前端工程" },
        ],
      },
      { id: "qa", label: "质量保障" },
    ],
  },
  { id: "product", label: "产品中心" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-actions">
      <label
        >筛选方式<HysSelect
          v-model="mode"
          :options="[
            { label: '隐藏不匹配分支', value: 'hide' },
            { label: '保留结构并标记匹配', value: 'highlight' },
          ]" /></label
      ><HysCheckbox v-model="children" label="同时展示匹配节点的子级" />
    </div>
    <HysTree
      v-model:search-value="query"
      :nodes="nodes"
      :filter-mode="mode"
      :show-matched-children="children"
      default-expand-all
    /><output>搜索条件：{{ query || "无" }}</output>
    <p class="scenario-note">
      隐藏模式保留匹配节点的祖先，清空搜索后恢复原有展开状态。
    </p>
  </div>
</template>
