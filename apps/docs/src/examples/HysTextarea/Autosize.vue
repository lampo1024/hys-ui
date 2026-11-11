<script setup lang="ts">
import { ref } from "vue";
import { HysTextarea, HysButton, type HysTextareaInstance } from "hys-ui";
const value = ref("记录想法\n自动适应内容高度");
const editor = ref<HysTextareaInstance>();
const measurement = ref("");
async function measure() {
  await editor.value?.resizeTextarea();
  const height = editor.value?.textareaStyle.height;
  if (height)
    measurement.value = `当前高度 ${Math.round(parseFloat(height))} px`;
}
</script>
<template>
  <div class="demo-content">
    <HysTextarea
      ref="editor"
      v-model="value"
      label="自动高度"
      :autosize="{ minRows: 2, maxRows: 6 }"
      clearable
      aria-label="自动高度说明"
    />
    <div class="demo-row">
      <HysButton variant="secondary" @click="value += '\n新添加的一行说明。'"
        >添加一行</HysButton
      ><HysButton variant="ghost" @click="value = ''">清空说明</HysButton>
      <HysButton variant="secondary" @click="measure">测量高度</HysButton>
      <span v-if="measurement" role="status">{{ measurement }}</span>
    </div>
    <p class="scenario-note">
      最少 2 行，最多 6
      行；达到上限后可在控件内滚动。父容器宽度变化时重新计算高度。
    </p>
  </div>
</template>
