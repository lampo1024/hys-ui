<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysModal,
  HysNumberInput,
  HysSelect,
  type HysModalSectionSize,
} from "hys-ui";
const open = ref(false),
  headerSize = ref<HysModalSectionSize>("sm"),
  footerSize = ref<HysModalSectionSize>("md"),
  custom = ref(false),
  headerHeight = ref(80),
  footerHeight = ref(76),
  titleFontSize = ref(18);
const sizes = [
  { label: "紧凑 sm", value: "sm" },
  { label: "标准 md", value: "md" },
  { label: "宽松 lg", value: "lg" },
];
</script>
<template>
  <div class="demo-controls">
    <section class="demo-control-section">
      <h3>分区尺寸</h3>
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>标题区</span><HysSelect v-model="headerSize" :options="sizes"
        /></label>
        <label class="demo-field"
          ><span>操作区</span><HysSelect v-model="footerSize" :options="sizes"
        /></label>
        <label class="demo-field"
          ><span>标题字号</span
          ><HysNumberInput v-model="titleFontSize" :min="12" :max="32"
        /></label>
      </div>
    </section>
    <section class="demo-control-section">
      <h3><HysCheckbox v-model="custom" label="自定义分区最小高度" /></h3>
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>标题区高度</span
          ><HysNumberInput
            v-model="headerHeight"
            :disabled="!custom"
            :min="40"
            :max="160"
        /></label>
        <label class="demo-field"
          ><span>操作区高度</span
          ><HysNumberInput
            v-model="footerHeight"
            :disabled="!custom"
            :min="40"
            :max="160"
        /></label>
      </div>
    </section>
  </div>
  <div class="demo-content">
    <HysButton @click="open = true">预览标题和操作区尺寸</HysButton>
  </div>
  <HysModal
    v-model:open="open"
    title="独立的分区尺寸"
    footer
    size="lg"
    :header-size="headerSize"
    :footer-size="footerSize"
    :title-font-size="titleFontSize"
    :header-height="custom ? headerHeight : undefined"
    :footer-height="custom ? footerHeight : undefined"
  >
    <p>
      标题区和底部操作区可独立设置尺寸；内置按钮跟随
      footerSize。自定义最小高度允许内容自然撑开，长标题与按钮不会被固定高度裁切。
    </p>
  </HysModal>
</template>
