<script setup lang="ts">
import { ref } from "vue";
import {
  HysTreeSelect,
  HysButton,
  type HysTreeSelectDataNode,
  type HysTreeSelectInstance,
} from "hys-ui";
const value = ref<number[]>([80]),
  api = ref<HysTreeSelectInstance<HysTreeSelectDataNode<number>>>();
const nodes: HysTreeSelectDataNode<number>[] = Array.from(
  { length: 250 },
  (_, group) => ({
    value: group * 81,
    label: `项目组 ${group + 1}`,
    children: Array.from({ length: 80 }, (_, i) => ({
      value: group * 81 + i + 1,
      label: `成员 ${group + 1} · ${i + 1}`,
    })),
  }),
);
</script>
<template>
  <div class="demo-stack">
    <HysTreeSelect
      ref="api"
      v-model="value"
      :nodes="nodes"
      virtual
      multiple
      leaf-only
      clearable
      :item-height="32"
      :list-height="280"
      :max-tag-count="3"
    />
    <div class="demo-actions">
      <HysButton
        size="sm"
        @click="api?.scrollTo({ key: 20249, align: 'bottom' })"
        >定位末尾成员</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="api?.scrollTo({ key: 0, align: 'top' })"
        >回到首组</HysButton
      >
    </div>
    <output>已选：{{ value.join("、") }}</output>
    <p class="scenario-note">
      大列表只渲染可见行与缓冲区，支持方向键、Home / End 与按编号定位。
    </p>
  </div>
</template>
