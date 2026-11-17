<script setup lang="ts">
import { ref } from "vue";
import { HysMenu, HysSearch, type HysMenuItem } from "hys-ui";
const query = ref("");
const active = ref("handoff");
const items: HysMenuItem[] = [
  {
    key: "operations",
    label: "现场运营",
    children: [
      { key: "handoff", label: "交接台账", keywords: ["handoff", "Shift"] },
      { key: "sla", label: "服务超时", keywords: ["SLA", "工单"], badge: 6 },
    ],
  },
  {
    key: "billing",
    label: "结算与审计",
    children: [
      { key: "invoices", label: "发票核对", keywords: ["invoice", "财务"] },
      { key: "audit", label: "审计记录", keywords: ["audit"] },
    ],
  },
];
</script>
<template>
  <div class="demo-stack">
    <HysSearch
      v-model="query"
      aria-label="查找模块"
      placeholder="试试 SLA 或 发票"
    />
    <HysMenu
      :items="items"
      :search="query"
      :selected-keys="[active]"
      :default-open-keys="['operations']"
      @select="active = String($event)"
    />
    <span role="status">当前模块 · {{ active }}</span>
  </div>
</template>
