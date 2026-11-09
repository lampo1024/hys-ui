<script setup lang="ts">
import { ref } from "vue";
import { HysTree, HysCheckbox, HysButton, type HysTreeInstance } from "hys-ui";
const accordion = ref(true),
  click = ref(true),
  api = ref<HysTreeInstance>();
const nodes = [
  {
    id: "product",
    label: "产品资料",
    children: [
      {
        id: "plan",
        label: "产品规划",
        children: [{ id: "roadmap", label: "发布路线图" }],
      },
      { id: "spec", label: "需求说明" },
    ],
  },
  {
    id: "engineering",
    label: "工程资料",
    children: [
      { id: "architecture", label: "系统架构" },
      { id: "testing", label: "测试计划" },
    ],
  },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-actions">
      <HysCheckbox v-model="accordion" label="同级手风琴" /><HysCheckbox
        v-model="click"
        label="点击文字展开"
      />
    </div>
    <HysTree
      ref="api"
      :nodes="nodes"
      :accordion="accordion"
      :expand-on-click-node="click"
      :default-expanded-keys="['product']"
    />
    <div class="demo-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="api?.setCurrentKey('roadmap')"
        >定位深层节点</HysButton
      ><HysButton size="sm" variant="secondary" @click="api?.collapseAll()"
        >折叠全部</HysButton
      >
    </div>
  </div>
</template>
