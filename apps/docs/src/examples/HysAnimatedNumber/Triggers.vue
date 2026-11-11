<script setup lang="ts">
import { ref } from "vue";
import {
  HysAnimatedNumber,
  HysButton,
  HysCheckbox,
  HysSelect,
  type HysNumberTrigger,
} from "hys-ui";

const mode = ref<HysNumberTrigger>("visible");
const once = ref(true);
const allowed = ref(true);
const target = ref(320);
const count = ref(0);
const modes = [
  { value: "visible", label: "进入视口" },
  { value: "click", label: "点击或键盘激活" },
  { value: "hover", label: "悬停或聚焦" },
  { value: "mount", label: "挂载" },
  { value: "update", label: "目标变化" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="demo-field"
        >触发方式<HysSelect v-model="mode" :options="modes"
      /></label>
      <HysCheckbox v-model="once" label="视口仅触发一次" />
      <HysCheckbox v-model="allowed" label="允许播放" />
      <HysButton size="sm" variant="secondary" @click="target += 100"
        >更新目标</HysButton
      >
    </div>
    <div
      class="trigger-preview"
      :class="{ 'trigger-scroll': mode === 'visible' }"
      role="region"
      aria-label="数字动画触发预览"
      :tabindex="mode === 'visible' ? 0 : undefined"
    >
      <p v-if="mode === 'visible'" class="trigger-hint">
        向下滚动这个区域，数字进入视口后开始播放。
      </p>
      <HysAnimatedNumber
        :key="mode"
        title="当前销量"
        :from="0"
        :value="target"
        :duration="1400"
        :trigger="mode"
        :can-play="allowed"
        :visible-once="once"
        :pause-outside="mode === 'visible'"
        :value-style="{ fontSize: '2rem', fontWeight: 650 }"
        @start="count++"
      />
    </div>
    <output>播放次数 {{ count }} · 目标 {{ target }}</output>
  </div>
</template>

<style scoped>
.trigger-preview {
  padding: 1rem;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: var(--docs-bg);
}
.trigger-scroll {
  block-size: 10rem;
  overflow: auto;
  overscroll-behavior: contain;
}
.trigger-hint {
  min-block-size: 9.5rem;
  margin: 0;
  color: var(--docs-muted);
  font-size: 0.8rem;
}
</style>
