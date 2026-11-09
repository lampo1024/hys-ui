<script setup lang="ts">
import { ref } from "vue";
import {
  HysTreeSelect,
  HysSelect,
  HysCheckbox,
  type HysTreeKey,
  type HysTreeSelectStrategy,
} from "hys-ui";
const value = ref<HysTreeKey[]>(["view"]),
  strategy = ref<HysTreeSelectStrategy>("child"),
  strict = ref(false);
const nodes = [
  {
    value: "project",
    label: "项目权限",
    children: [
      { value: "view", label: "查看项目" },
      { value: "edit", label: "编辑项目" },
      { value: "security", label: "安全配置", disableCheckbox: true },
    ],
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-actions">
      <label
        >回填策略<HysSelect
          v-model="strategy"
          :options="[
            { label: '仅子节点', value: 'child' },
            { label: '优先父节点', value: 'parent' },
            { label: '全部节点', value: 'all' },
          ]" /></label
      ><HysCheckbox v-model="strict" label="父子独立勾选" />
    </div>
    <HysTreeSelect
      v-model="value"
      :nodes="nodes"
      :show-checked-strategy="strategy"
      :check-strictly="strict"
      checkable
      clearable
    /><output>{{ JSON.stringify(value) }}</output>
    <p class="scenario-note">
      表头分支可批量勾选，部分勾选显示半选。独立模式保留每个节点自己的选择，禁用复选框受到保护。
    </p>
  </div>
</template>
