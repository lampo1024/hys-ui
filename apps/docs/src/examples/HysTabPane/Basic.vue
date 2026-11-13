<script setup lang="ts">
import { ref } from "vue";
import { FolderOpen } from "lucide-vue-next";
import { HysCheckbox, HysTabPane, HysTabs, type HysTabValue } from "hys-ui";
const active = ref<HysTabValue>("overview"),
  showNotes = ref(true);
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="showNotes" label="显示备注面板" />
    <div class="demo-panel">
      <HysTabs v-model="active" aria-label="项目详情">
        <HysTabPane value="overview" label="项目概览" :icon="FolderOpen"
          >项目处于进行中，本周计划交付两个模块。</HysTabPane
        >
        <HysTabPane v-if="showNotes" value="notes" label="项目备注" :badge="2">
          <template #label="{ item }">{{ item.label }}</template>
          两条备注待跟进。
        </HysTabPane>
        <HysTabPane value="archive" label="项目归档" disabled />
      </HysTabs>
    </div>
  </div>
</template>
