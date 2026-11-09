<script setup lang="ts">
import { ref } from "vue";
import {
  HysTree,
  HysButton,
  type HysTreeInstance,
  type HysTreeKey,
  type HysTreeNode,
} from "hys-ui";
const api = ref<HysTreeInstance<HysTreeNode<number>>>(),
  selected = ref<HysTreeKey | null>(null);
const nodes: HysTreeNode<number>[] = Array.from(
  { length: 200 },
  (_, group) => ({
    id: group * 101,
    label: `项目组 ${group + 1}`,
    children: Array.from({ length: 100 }, (_, i) => ({
      id: group * 101 + i + 1,
      label: `成员 ${group + 1} · ${i + 1}`,
    })),
  }),
);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-actions">
      <HysButton size="sm" @click="api?.scrollTo({ key: 20199, align: 'top' })"
        >定位最后一组</HysButton
      ><HysButton size="sm" variant="secondary" @click="api?.focus(0)"
        >回到首项</HysButton
      >
    </div>
    <HysTree
      ref="api"
      v-model="selected"
      :nodes="nodes"
      default-expand-all
      virtual
      :row-height="36"
      :viewport-height="320"
    /><output>选中编号：{{ selected ?? "无" }}</output>
    <p class="scenario-note">
      大列表仅渲染可见行及缓冲区。自定义内容应与 rowHeight 一致，支持 Home、End
      和方向键定位。
    </p>
  </div>
</template>
