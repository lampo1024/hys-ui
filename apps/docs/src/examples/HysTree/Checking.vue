<script setup lang="ts">
import { ref } from "vue";
import {
  HysTree,
  HysCheckbox,
  HysButton,
  type HysTreeInstance,
  type HysTreeKey,
} from "hys-ui";
const strict = ref(false),
  keys = ref<HysTreeKey[]>(["read"]),
  api = ref<HysTreeInstance>(),
  output = ref("");
const nodes = [
  {
    id: "permissions",
    label: "成员权限",
    children: [
      { id: "read", label: "查看内容" },
      { id: "edit", label: "编辑内容" },
      {
        id: "security",
        label: "安全管理",
        disableCheckbox: true,
        children: [{ id: "audit", label: "审计记录" }],
      },
    ],
  },
];
function read() {
  output.value = JSON.stringify(
    {
      checked: api.value?.getCheckedKeys(),
      leaves: api.value?.getCheckedKeys(true),
      half: api.value?.getHalfCheckedKeys(),
    },
    null,
    2,
  );
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="strict" label="父子独立勾选" /><HysTree
      ref="api"
      v-model:checked-keys="keys"
      :nodes="nodes"
      :check-strictly="strict"
      checkable
      default-expand-all
    />
    <div class="demo-actions">
      <HysButton size="sm" @click="api?.setCheckedKeys(['permissions'])"
        >勾选权限分支</HysButton
      ><HysButton size="sm" variant="secondary" @click="read"
        >读取勾选与半选</HysButton
      ><HysButton size="sm" variant="secondary" @click="api?.setCheckedKeys([])"
        >清空可编辑勾选</HysButton
      >
    </div>
    <output>{{ output || `已勾选：${keys.join("、")}` }}</output>
    <p class="scenario-note">
      禁用复选框阻断父子联动，保护其原有状态；分支下面的可用节点仍可单独操作。
    </p>
  </div>
</template>
