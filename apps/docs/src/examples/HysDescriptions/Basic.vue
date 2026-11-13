<script setup lang="ts">
import { computed, ref } from "vue";
import { HysCheckbox, HysDescriptions, type HysDescriptionItem } from "hys-ui";
const showContact = ref(true),
  colon = ref(false);
const items = computed<HysDescriptionItem[]>(() => [
  { key: "id", label: "报告编号", value: "RP-2026-114" },
  { key: "team", label: "归属团队", value: "运营分析" },
  { key: "contact", label: "联系人", value: null, hidden: !showContact.value },
  { key: "alerts", label: "异常数", value: 0 },
  {
    key: "shared",
    label: "外部共享",
    value: false,
    format: (value) => (value ? "已开启" : "未开启"),
  },
  { key: "cycle", label: "报告周期", value: "每周" },
]);
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="showContact" label="显示联系人" />
      <HysCheckbox v-model="colon" label="标签后显示冒号" />
    </div>
    <div class="demo-panel">
      <HysDescriptions
        title="周度经营报告"
        :items="items"
        :colon="colon"
        :columns="{ xs: 1, sm: 2, md: 3 }"
        placeholder="待补充"
      />
    </div>
  </div>
</template>
