<script setup lang="ts">
import { HysDivider, HysButton } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysButton variant="ghost">概览</HysButton
      ><HysDivider direction="vertical" /><HysButton variant="ghost"
        >动态</HysButton
      ><HysDivider direction="vertical" border-style="dashed" /><HysButton
        variant="ghost"
        >成员</HysButton
      >
    </div>
    <div dir="rtl">
      <HysDivider orientation="start">逻辑起始位置</HysDivider
      ><HysDivider orientation="end">逻辑结束位置</HysDivider>
    </div>
  </div>
  <p class="hint">
    start / end 跟随文字方向，left / right
    表示固定物理方向。垂直分隔线用于行内内容，不显示文字。
  </p>
</template>
