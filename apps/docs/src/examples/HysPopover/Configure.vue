<script setup lang="ts">
import { reactive } from "vue";
import {
  HysPopover,
  HysButton,
  HysInput,
  HysSelect,
  HysCheckbox,
  type HysPopupTrigger,
  type HysPopupPlacement,
} from "hys-ui";
const config = reactive({
  trigger: "click" as HysPopupTrigger,
  placement: "bottom-end" as HysPopupPlacement,
  disabled: false,
  showArrow: true,
  enterable: true,
  title: "自定义标题",
});
const modes = ["hover", "focus", "click", "contextmenu", "manual"].map(
    (value) => ({ label: value, value }),
  ),
  positions = [
    "top-start",
    "top",
    "top-end",
    "right-start",
    "right",
    "right-end",
    "bottom-end",
    "bottom",
    "bottom-start",
    "left-end",
    "left",
    "left-start",
  ].map((value) => ({ label: value, value }));
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <div class="demo-control-fields">
        <label class="demo-field"
          ><span>触发方式</span
          ><HysSelect v-model="config.trigger" :options="modes" /></label
        ><label class="demo-field"
          ><span>显示位置</span
          ><HysSelect v-model="config.placement" :options="positions" /></label
        ><label class="demo-field"
          ><span>标题</span><HysInput v-model="config.title"
        /></label>
      </div>
      <div class="demo-control-actions">
        <HysCheckbox v-model="config.disabled" label="禁用提示" /><HysCheckbox
          v-model="config.showArrow"
          label="显示箭头"
        /><HysCheckbox v-model="config.enterable" label="允许移入浮层" />
      </div>
    </div>
    <div class="demo-content">
      <HysPopover v-bind="config"
        ><template #trigger><HysButton>交互配置预览</HysButton></template>
        <p>这里展示当前配置下的内容。</p></HysPopover
      >
    </div>
    <output class="state-output"
      >{{ config.trigger }} · {{ config.placement }}</output
    >
  </div>
</template>
