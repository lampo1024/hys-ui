<script setup lang="ts">
import { reactive, ref } from "vue";
import { Send } from "lucide-vue-next";
import { HysButton, HysCheckbox, HysSelect, type HysButtonVariant } from "hys-ui";

const settings = reactive({
  type: "primary" as HysButtonVariant,
  size: "default" as "small" | "default" | "large",
  shape: "default" as "default" | "round" | "circle",
  plain: false,
  loading: false,
  disabled: false,
});
const clicked = ref(false);
const appearances = [
  { label: "语义外观", options: [
    { label: "主要", value: "primary" },
    { label: "次要", value: "secondary" },
    { label: "成功", value: "success" },
    { label: "警告", value: "warning" },
    { label: "危险", value: "danger" },
    { label: "信息", value: "info" },
    { label: "幽灵", value: "ghost" },
    { label: "文字", value: "text" },
    { label: "链接", value: "link" },
  ] },
  { label: "内置配色", options: [
    { label: "石板灰", value: "slate" },
    { label: "钴蓝", value: "blue" },
    { label: "靛蓝", value: "indigo" },
    { label: "紫罗兰", value: "purple" },
    { label: "湖青", value: "cyan" },
    { label: "青绿", value: "teal" },
    { label: "翡翠绿", value: "green" },
    { label: "青柠", value: "lime" },
    { label: "琥珀", value: "amber" },
    { label: "柑橘", value: "orange" },
    { label: "朱红", value: "red" },
    { label: "玫红", value: "pink" },
  ] },
];
const sizes = [
  { label: "小", value: "small" },
  { label: "默认", value: "default" },
  { label: "大", value: "large" },
];
const shapes = [
  { label: "默认", value: "default" },
  { label: "圆角", value: "round" },
  { label: "圆形", value: "circle" },
];
</script>

<template>
  <div class="button-playground">
    <div class="button-playground-controls">
      <div class="button-playground-fields">
        <label>外观与配色<HysSelect v-model="settings.type" :options="appearances" size="sm" aria-label="按钮外观" /></label>
        <label>尺寸<HysSelect v-model="settings.size" :options="sizes" size="sm" aria-label="按钮尺寸" /></label>
        <label>形状<HysSelect v-model="settings.shape" :options="shapes" size="sm" aria-label="按钮形状" /></label>
      </div>
      <div class="button-playground-flags">
        <HysCheckbox v-model="settings.plain" label="朴素" />
        <HysCheckbox v-model="settings.loading" label="加载" />
        <HysCheckbox v-model="settings.disabled" label="禁用" />
      </div>
    </div>
    <div class="button-playground-preview">
      <HysButton v-bind="settings" :icon="Send" aria-label="发送预览" @click="clicked = true">
        {{ settings.shape === 'circle' ? '' : '发送' }}
      </HysButton>
      <small v-if="clicked" role="status">已触发点击</small>
    </div>
  </div>
</template>

<style scoped>
.button-playground {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(130px, 0.45fr);
  gap: 16px;
  align-items: stretch;
}
.button-playground-controls { display: grid; gap: 12px; align-content: center; }
.button-playground-fields { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
.button-playground-fields label { display: grid; gap: 6px; font-size: 12px; min-width: 0; }
.button-playground-flags { display: flex; flex-wrap: wrap; gap: 6px 14px; }
.button-playground-preview {
  display: grid;
  place-content: center;
  justify-items: center;
  gap: 8px;
  min-height: 100px;
  padding: 12px;
  border-radius: 8px;
  background: var(--hys-ui-surface-alt, var(--hys-ui-theme-surface-alt));
}
@media (max-width: 680px) {
  .button-playground { grid-template-columns: minmax(0, 1fr); }
}
</style>
