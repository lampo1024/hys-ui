<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysPermissionMatrix, type HysPermissionCell } from "hys-ui";
const filter = ref("订单"),
  access = ref<Record<string, boolean>>({});
const changes = ref<HysPermissionCell[]>([]);
const roles = ["运营", "审计"];
const resources = ["查看订单", "修改订单", "查看日志"];
</script>

<template>
  <div class="demo-stack">
    <HysInput
      v-model="filter"
      aria-label="筛选资源"
      placeholder="筛选资源"
      clearable
    />
    <HysPermissionMatrix
      v-model="access"
      :roles="roles"
      :resources="resources"
      :filter="filter"
      empty-text="没有匹配的资源"
      @cells-change="changes = $event"
    />
    <output v-if="changes.length" class="state-output" aria-live="polite"
      >本次更新 {{ changes.length }} 项权限</output
    >
  </div>
</template>
