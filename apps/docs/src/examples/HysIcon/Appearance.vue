<script setup lang="ts">
import { ref } from "vue";
import {
  HysCheckbox,
  HysIcon,
  HysNumberInput,
  HysSelect,
  provideHysConfig,
  type HysTheme,
} from "hys-ui";
const size = ref(32),
  angle = ref(0),
  theme = ref<HysTheme | "system">("blue"),
  flipped = ref(false);
provideHysConfig({
  theme: () => (theme.value === "system" ? "blue" : theme.value),
});
const variants = [
  { name: "folder", style: "outline", label: "线性" },
  { name: "folder", style: "filled", label: "实心" },
  { name: "folder", style: "duotone", label: "双色" },
  { name: "folder", style: "multicolor", label: "多色" },
  { name: "folder", style: "flat", label: "扁平" },
  { name: "folder", style: "round", label: "圆角" },
  { name: "folder", style: "sharp", label: "锐角" },
  { name: "star", style: "gradient", label: "渐变" },
  { name: "cube", style: "3d", label: "立体" },
  { name: "heart", style: "bold", label: "粗线" },
  { name: "heart", style: "thin", label: "细线" },
  { name: "vue", style: "outline", label: "品牌" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          >尺寸（px）<HysNumberInput
            v-model="size"
            :min="12"
            :max="64"
            :step="4"
        /></label>
        <label class="demo-field"
          >旋转角度<HysNumberInput
            v-model="angle"
            :min="-180"
            :max="180"
            :step="15"
        /></label>
        <label class="demo-field"
          >预览主题<HysSelect
            v-model="theme"
            aria-label="预览主题"
            :options="[
              { label: '亮色', value: 'blue' },
              { label: '深色', value: 'dark' },
              { label: '紫色', value: 'purple' },
              { label: '跟随系统', value: 'system' },
            ]"
        /></label>
      </div>
    </div>
    <HysCheckbox v-model="flipped" label="水平翻转" />
    <div class="icon-variant-grid">
      <div
        v-for="item in variants"
        :key="item.name + item.style"
        class="demo-panel"
      >
        <HysIcon
          :name="item.name"
          :theme="theme"
          :variant="item.style"
          :size="size"
          :rotate="angle"
          :flip-x="flipped"
          background="var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))"
          shape="circle"
          :padding="7"
        />
        <span>{{ item.label }}</span>
      </div>
    </div>
    <div class="demo-panel demo-control-actions">
      <HysIcon
        name="search"
        :theme="theme"
        :size="size"
        :gradient="['#467dfa', '#9256dc']"
        :stroke-width="2.4"
        border="1px solid #9199d8"
        :padding="8"
        :radius="10"
        shadow="0 4px 14px #5676aa30"
      />
      <HysIcon
        name="star"
        :theme="theme"
        size="clamp(20px, 4vw, 44px)"
        color="#ad6b05"
      />
      <span class="hint">渐变描边与响应式尺寸</span>
    </div>
  </div>
</template>

<style scoped>
.icon-variant-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 88px), 1fr));
  gap: 7px;
}
.icon-variant-grid :deep(.demo-panel) {
  display: grid;
  justify-items: center;
  gap: 7px;
  padding: 9px 5px;
  font-size: 11px;
}
</style>
