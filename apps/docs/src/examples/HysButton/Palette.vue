<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCheckbox, type HysButtonPaletteColor } from "hys-ui";

const colors = [
  { value: "slate", label: "石板灰" },
  { value: "blue", label: "钴蓝" },
  { value: "indigo", label: "靛蓝" },
  { value: "purple", label: "紫罗兰" },
  { value: "cyan", label: "湖青" },
  { value: "teal", label: "青绿" },
  { value: "green", label: "翡翠绿" },
  { value: "lime", label: "青柠" },
  { value: "amber", label: "琥珀" },
  { value: "orange", label: "柑橘" },
  { value: "red", label: "朱红" },
  { value: "pink", label: "玫红" },
] satisfies { value: HysButtonPaletteColor; label: string }[];
const selected = ref<HysButtonPaletteColor>("teal");
const dark = ref(false);
</script>

<template>
  <div class="button-palette-demo">
    <HysCheckbox v-model="dark" label="深色背景" size="sm" />
    <div class="button-palette-preview" :class="{ 'button-palette-preview-dark': dark }">
      <div class="button-palette-swatches" role="group" aria-label="内置配色">
        <HysButton
          v-for="item in colors"
          :key="item.value"
          :variant="item.value"
          :dark="dark"
          :pressed="selected === item.value"
          size="sm"
          @click="selected = item.value"
        >{{ item.label }}</HysButton>
      </div>
      <div class="demo-row button-palette-styles">
        <HysButton :variant="selected" :dark="dark" size="sm" plain>朴素</HysButton>
        <HysButton :variant="selected" :dark="dark" size="sm" text bg>文字底色</HysButton>
        <HysButton :variant="selected" :dark="dark" size="sm" link>链接</HysButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.button-palette-demo { display: grid; justify-items: start; gap: 10px; }
.button-palette-preview {
  box-sizing: border-box;
  width: 100%;
  padding: 12px;
  border: 1px solid var(--docs-border);
  border-radius: 8px;
  background: #fff;
}
.button-palette-preview-dark { background: #141414; border-color: #303030; }
.button-palette-swatches { display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 8px; }
.button-palette-swatches :deep([aria-pressed="true"]) {
  outline: 1px solid var(--hys-ui-button-color);
  outline-offset: 2px;
}
.button-palette-swatches :deep(:focus-visible) { outline-width: 2px; }
.button-palette-styles { margin-top: 12px; }
@media (max-width: 820px) {
  .button-palette-swatches { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
</style>
