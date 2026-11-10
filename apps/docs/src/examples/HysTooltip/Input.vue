<script setup lang="ts">
import { ref } from "vue";
import { HysTooltip, HysInput, HysSelect, HysButton } from "hys-ui";
const query = ref(""),
  value = ref("alpha"),
  options = [
    { label: "方案 Alpha", value: "alpha" },
    { label: "方案 Beta", value: "beta" },
  ];
</script>
<template>
  <div class="demo-stack">
    <HysTooltip text="输入名称查询资源；空格和回车保留输入框原有行为。"
      ><HysInput v-model="query" placeholder="输入资源名称" /></HysTooltip
    ><HysTooltip text="选择方案；文字提示和下拉选项独立管理。"
      ><HysSelect v-model="value" :options="options" /></HysTooltip
    ><output class="state-output"
      >{{ query || "尚未输入" }} · {{ value }}</output
    >
    <p class="scenario-note">
      使用输入或选择控件作为触发内容时，保留原生编辑按键与控件自身的浮层；包装层不会增加额外的
      Tab 焦点。
    </p>
  </div>
</template>
