<script setup lang="ts">
import { ref } from "vue";
import { HysPermissionMatrix, type HysPermissionCell } from "hys-ui";

const roles = ["管理员", "运营", "审计"];
const resources = ["查看订单", "退款审批", "查看日志"];
const permissions = ref<Record<string, boolean>>({
  "退款审批:管理员": true,
  "查看日志:审计": true,
});
const changes = ref<HysPermissionCell[]>([]);
const cellDisabled = ({ resource, role }: HysPermissionCell) =>
  (resource === "退款审批" && role !== "运营") ||
  (resource === "查看日志" && role === "审计");
</script>

<template>
  <div class="demo-stack">
    <p class="locked-hint">勾选行或列标题可批量授权。灰色复选框由系统锁定。</p>
    <HysPermissionMatrix
      v-model="permissions"
      :roles="roles"
      :resources="resources"
      :cell-disabled="cellDisabled"
      caption="订单工作台权限"
      @cells-change="changes = $event"
    />
    <output v-if="changes.length" class="state-output" aria-live="polite">
      本次变更 {{ changes.length }} 项权限
    </output>
  </div>
</template>

<style scoped>
.locked-hint {
  margin: 0;
  color: var(--hys-ui-theme-muted);
  font-size: 13px;
}
.state-output {
  margin: 0;
}
</style>
