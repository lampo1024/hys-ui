<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer, HysButton } from "hys-ui";
import type { HysTransferInstance, HysTransferOption } from "hys-ui";
const value = ref<number[]>([2, 3]),
  api = ref<HysTransferInstance<HysTransferOption<number>, number>>();
const options = Array.from({ length: 20000 }, (_, i) => ({
  value: i,
  label: "资源 " + String(i).padStart(5, "0"),
  disabled: i % 997 === 0,
}));
</script>
<template>
  <div class="demo-content">
    <HysTransfer
      ref="api"
      v-model="value"
      :options="options"
      virtual
      :list-height="280"
      :item-height="36"
      :overscan="5"
    />
    <div class="demo-row">
      <HysButton
        size="sm"
        variant="secondary"
        @click="api?.scrollTo('left', { key: 19999 })"
        >定位末尾资源</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        @click="api?.scrollTo('left', { top: 0 })"
        >回到顶部</HysButton
      >
    </div>
  </div>
  <output>数据源 20,000 项 · 已选择 {{ value.length }} 项</output>
  <p class="hint">
    只渲染视口附近的条目。拖拽、搜索和选择共用同一份数据，方向键与 Home / End
    可以将焦点移到尚未渲染的条目。
  </p>
</template>
