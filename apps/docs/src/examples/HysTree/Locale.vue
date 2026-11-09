<script setup lang="ts">
import { HysTree, type HysTreeLocale } from "hys-ui";
const nodes = [
  {
    id: "docs",
    label: "Documentation",
    children: [
      { id: "guide", label: "Guide" },
      { id: "api", label: "API reference" },
    ],
  },
];
const locale: Partial<HysTreeLocale> = {
  tree: "Knowledge base",
  search: "Find nodes",
  empty: "No documents",
  noMatch: "No matches",
  expand: "Expand",
  collapse: "Collapse",
  check: "Check",
  select: "Select item",
  close: "Close",
  loading: "Loading",
  retry: "Retry",
  loadError: "Load failed",
};
</script>
<template>
  <div class="demo-stack">
    <HysTree
      :nodes="nodes"
      :locale="locale"
      checkable
      default-expand-all
      context-menu
    />
    <p class="scenario-note">
      搜索、操作、加载、空态和辅助技术文字可以按需替换，未指定的内容保留默认值。
    </p>
  </div>
</template>
