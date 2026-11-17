<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysFilterBar,
  type HysFilterField,
  type HysFilterValues,
} from "hys-ui";
const fields: HysFilterField[] = [
  { key: "owner", label: "负责人", type: "text", placeholder: "输入姓名" },
  { key: "urgent", label: "处理优先级", type: "custom" },
];
const defaults = { owner: "", urgent: false };
const draft = ref<HysFilterValues>({ ...defaults });
const applied = ref<HysFilterValues>({ ...defaults });
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysButton
        variant="secondary"
        size="sm"
        @click="draft = { owner: '林宁', urgent: true }"
        >载入交接条件</HysButton
      >
    </div>
    <HysFilterBar
      v-model:values="draft"
      :initial-values="defaults"
      :fields="fields"
      :collapsed-count="1"
      size="sm"
      @search="applied = $event"
      @reset="applied = $event"
    >
      <template #field="{ value, setValue, disabled }">
        <HysCheckbox
          :model-value="Boolean(value)"
          :disabled="disabled"
          @update:model-value="setValue"
          >仅紧急工单</HysCheckbox
        >
      </template>
    </HysFilterBar>
    <span role="status"
      >{{ applied.owner || "全部负责人" }} ·
      {{ applied.urgent ? "仅紧急工单" : "全部工单" }}</span
    >
  </div>
</template>
