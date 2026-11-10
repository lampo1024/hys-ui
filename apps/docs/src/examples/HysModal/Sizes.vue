<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysModal, type HysModalSizeName } from "hys-ui";
const open = ref(false),
  size = ref<HysModalSizeName>("md");
const sizes: [HysModalSizeName, string, string][] = [
  ["xs", "360px", "简短确认"],
  ["sm", "440px", "提示与说明"],
  ["md", "560px", "常规表单"],
  ["lg", "720px", "复杂表单"],
  ["xl", "960px", "详情与预览"],
  ["2xl", "1200px", "表格工作区"],
  ["full", "可用宽度", "宽屏内容"],
];
function show(value: HysModalSizeName) {
  size.value = value;
  open.value = true;
}
</script>
<template>
  <div
    style="
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 14px;
    "
  >
    <HysButton
      v-for="[value, width, usage] in sizes"
      :key="value"
      variant="secondary"
      @click="show(value)"
      ><span style="display: grid; gap: 5px; text-align: left; min-width: 0"
        ><strong>{{ value }} · {{ width }}</strong
        ><small style="font-weight: 400; color: var(--docs-muted)">{{
          usage
        }}</small></span
      ></HysButton
    >
  </div>
  <HysModal
    v-model:open="open"
    title="尺寸预览"
    :size="size"
    footer
    show-fullscreen
    ><p>
      当前尺寸：<strong>{{ size }}</strong
      >。内置宽度受视口限制，窄屏自动保留边距；显式 width 优先于尺寸预设。
    </p>
    <p>
      full
      只铺满可用宽度，仍保留标题、内容和底部操作区；全屏使用右上角独立操作。
    </p></HysModal
  >
</template>
