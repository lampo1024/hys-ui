<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysEmpty,
  HysRecordPicker,
  type HysTableColumn,
  type HysTableKey,
} from "hys-ui";
const records = [
  { id: "A-17", name: "验收手册" },
  { id: "A-23", name: "安全清单" },
];
const columns: HysTableColumn<(typeof records)[number]>[] = [
  { key: "name", label: "归档资料" },
];
const open = ref(false);
const empty = ref(false);
const keys = ref<HysTableKey[]>(["A-17"]);
const status = ref("");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox v-model="empty">模拟权限变更后无可选资料</HysCheckbox>
      <HysButton size="sm" variant="secondary" @click="open = true"
        >配置引用资料</HysButton
      >
    </div>
    <HysRecordPicker
      v-model="keys"
      v-model:open="open"
      :show-trigger="false"
      :rows="empty ? [] : records"
      :columns="columns"
      title="配置引用资料"
      @confirm="status = '已更新引用'"
      @cancel="status = '已取消改动'"
    >
      <template #empty
        ><HysEmpty description="当前权限下无可选资料"
      /></template>
    </HysRecordPicker>
    <span role="status"
      >引用编号 · {{ keys.join("、") || "无"
      }}{{ status ? " · " + status : "" }}</span
    >
  </div>
</template>
