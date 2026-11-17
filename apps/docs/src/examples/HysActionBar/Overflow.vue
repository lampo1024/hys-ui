<script setup lang="ts">
import { ref } from "vue";
import { HysActionBar, HysCheckbox, type HysActionBarItem } from "hys-ui";
const actions: HysActionBarItem[] = [
  { key: "assign", label: "分派" },
  { key: "pause", label: "暂停" },
  { key: "tag", label: "添加标签" },
  { key: "archive", label: "归档", overflow: true, confirm: true },
  { key: "publish", label: "发布", disabled: true },
];
const selected = ref(true);
const result = ref("");
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="selected">选中一项待审变更</HysCheckbox>
    <HysActionBar
      :selected-count="selected ? 1 : 0"
      :actions="actions"
      visible-when-empty
      @action="
        result =
          '已登记操作 · ' + actions.find((item) => item.key === $event)?.label
      "
      @clear-selection="selected = false"
    />
    <span role="status">{{ result || "打开更多操作体验归档确认" }}</span>
  </div>
</template>
