<script setup lang="ts">
import { computed, ref } from "vue";
import { HysBadge, HysPageHeader, type HysPageHeaderAction } from "hys-ui";
const approved = ref(false);
const result = ref("");
const actions = computed<HysPageHeaderAction[]>(() => [
  {
    key: "approve",
    label: "通过验收",
    variant: "primary",
    disabled: approved.value,
  },
  { key: "notes", label: "查看交接备注" },
  {
    key: "withdraw",
    label: "退回草稿",
    overflow: true,
    disabled: approved.value,
  },
]);
function activate(key: string | number) {
  if (key === "approve") approved.value = true;
  result.value =
    key === "notes"
      ? "交接备注 · 需核对仓库签收记录"
      : key === "withdraw"
        ? "草稿已退回"
        : "验收已通过";
}
</script>
<template>
  <div class="demo-stack">
    <HysPageHeader
      title="发运系统验收"
      subtitle="交付批次 REL-2026-1105"
      :heading-level="3"
      :actions="actions"
      @action="activate"
    >
      <template #meta
        ><HysBadge :tone="approved ? 'green' : 'orange'">{{
          approved ? "已验收" : "待验收"
        }}</HysBadge
        ><span>负责人 林宁</span></template
      >
    </HysPageHeader>
    <span role="status">{{ result }}</span>
  </div>
</template>
