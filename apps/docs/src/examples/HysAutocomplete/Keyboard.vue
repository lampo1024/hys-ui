<script setup lang="ts">
import { ref } from "vue";
import {
  HysAutocomplete,
  HysButton,
  type HysAutocompleteInstance,
} from "hys-ui";
const value = ref(""),
  component = ref<HysAutocompleteInstance>(),
  options = ["Alpha", { value: "Beta", disabled: true }, "Gamma", "Delta"];
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton
        size="sm"
        @click="
          component?.focus();
          component?.open();
        "
        >聚焦并打开</HysButton
      ><HysButton size="sm" @click="component?.close()">关闭建议</HysButton
      ><HysButton size="sm" @click="component?.clear()">清空</HysButton>
    </div>
    <HysAutocomplete
      ref="component"
      v-model="value"
      :options="options"
      backfill
      select-on-tab
      :filter-option="false"
      placeholder="上下键预览，Enter 或 Tab 确认"
    /><output>已提交：{{ value || "未输入" }}</output>
    <p class="scenario-note">
      ↑ / ↓ 跳过禁用项，Home / End 定位首尾，PageUp / PageDown
      按可见页移动，Escape 撤销预览并关闭。backfill
      预览不会提前修改模型；selectOnTab 允许 Tab 确认。
    </p>
  </div>
</template>
