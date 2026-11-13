<script setup lang="ts">
import { ref } from "vue";
import {
  HysCheckbox,
  HysSelect,
  HysTabs,
  type HysTabAnimation,
  type HysTabValue,
} from "hys-ui";
const active = ref<HysTabValue>("overview"),
  sticky = ref(true),
  fixed = ref(false),
  gradient = ref(false);
const animation = ref<HysTabAnimation | "custom">("slide");
const items = [
  { value: "overview", label: "交付概览" },
  { value: "plan", label: "执行计划" },
  { value: "log", label: "变更记录" },
];
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >内容动效<HysSelect
            v-model="animation"
            aria-label="内容动效"
            :options="[
              { label: '滑动', value: 'slide' },
              { label: '渐变', value: 'fade' },
              { label: '缩放', value: 'scale' },
              { label: '弹性', value: 'spring' },
              { label: '自定义', value: 'custom' },
              { label: '关闭动效', value: 'none' },
            ]"
        /></label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="sticky" label="容器内吸顶" :disabled="fixed" />
        <HysCheckbox v-model="fixed" label="固定到视口" />
        <HysCheckbox v-model="gradient" label="渐变选中背景" />
      </div>
    </div>
    <div
      class="demo-panel tab-layout-scroll"
      tabindex="0"
      aria-label="可滚动的交付详情"
    >
      <HysTabs
        v-model="active"
        :items="items"
        type="pill"
        :sticky="sticky"
        :fixed="fixed"
        :bar-offset="fixed ? 74 : 0"
        :animation="animation === 'custom' ? undefined : animation"
        :animation-name="
          animation === 'custom' ? 'hys-doc-tabs-reveal' : undefined
        "
        :duration="280"
        :tab-width="92"
        :tab-height="36"
        :tab-max-width="112"
        :radius="10"
        align="between"
        separator
        overflow="wrap"
        :style="
          gradient
            ? {
                '--hys-tab-selection-bg':
                  'linear-gradient(110deg,var(--hys-ui-theme-primary-soft),transparent)',
              }
            : undefined
        "
      >
        <template #panel="{ item }">
          <div class="tab-layout-lines">
            <p v-for="index in 6" :key="index">
              {{ item.label }} · 第 {{ index }} 条交付信息
            </p>
          </div>
        </template>
      </HysTabs>
    </div>
  </div>
</template>
<style scoped>
.tab-layout-scroll {
  height: 225px;
  overflow: auto;
  padding: 0 12px;
  scrollbar-gutter: stable;
}
.tab-layout-lines p {
  margin: 0;
  padding: 9px 3px;
  border-block-end: 1px solid var(--docs-border);
}
</style>
<style>
@keyframes hys-doc-tabs-reveal {
  from {
    opacity: 0;
    clip-path: inset(0 0 32% 0);
  }
  to {
    opacity: 1;
    clip-path: inset(0);
  }
}
</style>
