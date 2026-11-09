<script setup lang="ts">
import { ref } from "vue";
import {
  HysCascader,
  HysButton,
  type HysCascaderDataNode,
  type HysCascaderValue,
  type HysCascaderInstance,
} from "hys-ui";
const options: HysCascaderDataNode[] = Array.from(
  { length: 200 },
  (_, group) => ({
    value: "group-" + group,
    label: "分类组 " + (group + 1),
    children: Array.from({ length: 100 }, (_, index) => ({
      value: group * 100 + index,
      label: "条目 " + (group * 100 + index),
      disabled: index === 1,
    })),
  }),
);
const value = ref<HysCascaderValue>([]),
  api = ref<HysCascaderInstance<HysCascaderDataNode>>();
</script>
<template>
  <div>
    <div class="demo-control-actions">
      <HysButton
        size="sm"
        variant="secondary"
        @click="api?.scrollTo(['group-199', 19999])"
        >定位最后一个条目</HysButton
      >
    </div>
    <div class="demo-content">
      <HysCascader
        ref="api"
        v-model="value"
        :options="options"
        virtual
        filterable
        clearable
        :list-height="260"
        :item-height="36"
      />
    </div>
    <output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      数据包含 200 个分组和 20,000
      个条目。每列只渲染视口附近的节点，搜索结果默认限制为 50 项；定位后可按
      Enter 选择。
    </p>
  </div>
</template>
