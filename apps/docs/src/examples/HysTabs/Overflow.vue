<script setup lang="ts">
import { computed, ref } from "vue";
import {
  HysTabs,
  HysButton,
  HysCheckbox,
  HysSelect,
  type HysTabValue,
} from "hys-ui";
const active = ref<HysTabValue>(1),
  compact = ref(false);
const overflow = ref<"scroll" | "wrap" | "menu" | "clip">("menu"),
  center = ref(false);
const choices = [
  { label: "滚动与搜索", value: "menu" },
  { label: "单行滚动", value: "scroll" },
  { label: "自动换行", value: "wrap" },
  { label: "裁切与搜索", value: "clip" },
];
const items = computed(() =>
  Array.from({ length: 24 }, (_, index) => ({
    value: index + 1,
    label: compact.value
      ? String(index + 1)
      : index === 23
        ? "月度经营报表与跨区域交付复核详情"
        : "内容分类 " + (index + 1),
    content: "分类 " + (index + 1) + " 的内容。",
  })),
);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >溢出方式<HysSelect
            v-model="overflow"
            aria-label="溢出方式"
            :options="choices"
        /></label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="center" label="激活项居中" />
        <HysCheckbox v-model="compact" label="使用简短标签" />
      </div>
    </div>
    <div class="demo-panel">
      <HysTabs
        v-model="active"
        :items="items"
        :overflow="overflow"
        :tab-max-width="140"
        :scroll-align="center ? 'center' : 'nearest'"
        wheel="scroll"
        drag-scroll
        aria-label="可滚动页签"
      />
    </div>
    <div class="demo-control-actions">
      <HysButton variant="secondary" @click="active = 24"
        >切换到最后一项</HysButton
      >
      <HysButton variant="ghost" @click="active = 1">回到第一项</HysButton>
    </div>
  </div>
</template>
