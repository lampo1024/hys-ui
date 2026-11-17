<script setup lang="ts">
import { ref } from "vue";
import { HysBadge, HysMenu, type HysMenuItem } from "hys-ui";
import { Download, FileText, Settings2 } from "hys-ui/icons";
const last = ref("选择一个操作");
const items: HysMenuItem[] = [
  { type: "group", label: "跟进记录" },
  { key: "create", label: "新增记录", icon: FileText },
  { key: "export", label: "导出清单", icon: Download },
  { type: "divider" },
  { key: "admin", label: "修改权限", icon: Settings2, disabled: true },
];
</script>
<template>
  <div class="demo-stack">
    <HysMenu
      mode="actions"
      :items="items"
      aria-label="审计操作"
      style="max-width: 300px"
      @select="(_key, { item }) => (last = 'label' in item ? item.label : '')"
    >
      <template #item="{ item, label }">
        <span>{{ label }}</span>
        <HysBadge
          v-if="'key' in item && item.key === 'admin'"
          size="sm"
          variant="warning"
          >只读权限</HysBadge
        >
      </template>
    </HysMenu>
    <span role="status">{{ last }}</span>
  </div>
</template>
