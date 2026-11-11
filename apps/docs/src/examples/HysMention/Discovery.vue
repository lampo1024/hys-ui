<script setup lang="ts">
import { ref } from "vue";
import { HysMention, type HysMentionOption } from "hys-ui";

const text = ref("");
const people: HysMentionOption[] = [
  {
    id: "1",
    value: "张三",
    label: "张三",
    description: "设计系统",
    group: "设计组",
    keywords: ["Design System"],
    recommended: true,
  },
  {
    id: "2",
    value: "李娜",
    label: "李娜",
    description: "组件研发",
    group: "研发组",
  },
  {
    id: "3",
    value: "周宁",
    label: "周宁",
    description: "质量保障",
    group: "质量组",
  },
  ...Array.from({ length: 300 }, (_, index) => ({
    id: "member-" + index,
    value: "成员 " + (index + 1),
    group: "项目成员",
    description: "工号 " + (1000 + index),
  })),
];
</script>

<template>
  <div class="demo-stack">
    <HysMention
      v-model="text"
      :options="people"
      type="text"
      recommend-on-focus
      :search-mode="['fuzzy', 'pinyin', 'initials']"
      :search-fields="['description']"
      sort-options
      highlight-match
      virtual
      :max-options="0"
      :popup-max-height="250"
      :popup-width="320"
      history-key="hys-docs-mention-history"
      placeholder="试试 @zhangsan、@zs 或 @1008"
    />
    <p class="scenario-note">
      聚焦查看推荐和最近使用。候选按组展示，300
      多条成员记录只渲染视口附近的选项。
    </p>
  </div>
</template>
