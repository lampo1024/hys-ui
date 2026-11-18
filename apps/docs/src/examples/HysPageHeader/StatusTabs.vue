<script setup lang="ts">
import { ref } from "vue";
import { HysPageHeader, HysSegmented } from "hys-ui";
const view = ref("check");
const tabs = [{value:"check",label:"验收记录"}, {value:"changes",label:"变更历史"}];
</script>

<template>
  <div class="demo-stack">
    <HysPageHeader title="华南仓交付" status="待签收" status-tone="warning">
      <template #tabs><HysSegmented v-model="view" :options="tabs" aria-label="交付详情页面" size="sm" /></template>
    </HysPageHeader>
    <p role="status">{{ view === "check" ? "尚无签收记录" : "09:30 更新了运输信息" }}</p>
  </div>
</template>
