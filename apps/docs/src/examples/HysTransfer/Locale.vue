<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer } from "hys-ui";
import type { HysTransferLocale } from "hys-ui";
const value = ref(["bob"]),
  options = [
    { value: "alice", label: "Alice" },
    { value: "bob", label: "Bob" },
    { value: "carol", label: "Carol" },
  ];
const locale: Partial<HysTransferLocale> = {
  leftTitle: "Available",
  rightTitle: "Selected",
  search: "Search members",
  emptyLeft: "No available members",
  emptyRight: "No selected members",
  noMatch: "No matching members",
  loading: "Loading…",
  selectAll: "Select all in {title}",
  invert: "Invert selection",
  moveRight: "Add selected",
  moveLeft: "Remove selected",
  remove: "Remove {label}",
  dragRight: "Drag to selected",
  dragLeft: "Drag to available",
  dragCount: "Dragging {count} items",
  moved: "Moved {count} items",
  previousPage: "Previous",
  nextPage: "Next",
  perPage: "Page size",
};
</script>
<template>
  <div class="demo-content">
    <HysTransfer
      v-model="value"
      :options="options"
      :locale="locale"
      show-invert
      aria-label="Member selection"
    />
  </div>
  <p class="hint">
    locale 可按需覆盖文案，操作按钮、搜索名称和移除提示会同步使用对应语言。
  </p>
</template>
