<script setup lang="ts">
import { ref } from "vue";
import { HysRecordPicker, type HysTableColumn, type HysTableKey } from "hys-ui";
const rows = [
  { id: "ops", label: "运营值班组" },
  { id: "devices", label: "设备支持组" },
  { id: "qa", label: "交付验收组" },
  { id: "finance", label: "财务核对组" },
  { id: "safety", label: "安全审查组" },
  { id: "service", label: "客户支持组" },
];
const columns: HysTableColumn<(typeof rows)[number]>[] = [
  { key: "label", label: "团队" },
];
const keys = ref<HysTableKey[]>([]);
</script>
<template>
  <div class="demo-stack">
    <HysRecordPicker
      v-model="keys"
      :rows="rows"
      :columns="columns"
      :page-size="3"
      :min-selected="1"
      :max-selected="2"
      multiple
      show-selected
      title="设置值班团队"
      :labels="{ trigger: '设置值班团队' }"
    />
    <small
      >至少选择 1 个团队，最多 2 个。可在选中标签上移除其他页的团队。</small
    >
    <span role="status"
      >已确认 ·
      {{
        keys
          .map((key) => rows.find((row) => row.id === key)?.label)
          .join("、") || "无"
      }}</span
    >
  </div>
</template>
