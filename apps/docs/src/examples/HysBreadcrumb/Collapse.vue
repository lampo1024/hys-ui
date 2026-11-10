<script setup lang="ts">
import { ref } from "vue";
import { HysBreadcrumb, HysNumberInput } from "hys-ui";
const max = ref(4),
  items = [
    "首页",
    "工作空间",
    "文档中心",
    "前端组件",
    "表单输入",
    "文本输入",
    "示例详情",
  ].map((label, i) => ({ label, href: "#level-" + i }));
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <label class="demo-field"
        ><span>显示项上限</span><HysNumberInput v-model="max" :min="3" :max="7"
      /></label>
    </div>
    <HysBreadcrumb :items="items" :max-items="max" :items-after-collapse="2" />
    <p class="scenario-note">
      maxItems 包含省略入口，默认 0 展示全部。itemsBeforeCollapse 和
      itemsAfterCollapse 保留前后层级；中间层级仍可从菜单访问，并保留原始索引。
    </p>
  </div>
</template>
