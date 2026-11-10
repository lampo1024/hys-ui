<script setup lang="ts">
import { reactive } from "vue";
import {
  HysTooltip,
  HysButton,
  HysInput,
  HysSelect,
  HysCheckbox,
  type HysPopupTrigger,
  type HysPopupPlacement,
} from "hys-ui";
const config = reactive({
  trigger: "hover" as HysPopupTrigger,
  placement: "top-start" as HysPopupPlacement,
  disabled: false,
  showArrow: true,
  enterable: false,
  text: "自定义提示",
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
          ><span>提示内容</span><HysInput v-model="config.text"
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
      <HysTooltip v-bind="config"
        ><HysButton>交互配置预览</HysButton></HysTooltip
      >
    </div>
    <output class="state-output"
      >{{ config.trigger }} · {{ config.placement }}</output
    >
  </div>
</template>
