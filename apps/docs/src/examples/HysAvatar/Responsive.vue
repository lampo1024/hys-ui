<script setup lang="ts">
import { HysAvatar, type HysAvatarSize } from "hys-ui";
const size: HysAvatarSize = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64, xxl: 80 };
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysAvatar :size="size" name="响应式圆形">HYS</HysAvatar
      ><HysAvatar :size="size" name="响应式方形" shape="square">UI</HysAvatar>
    </div>
    <p class="scenario-note">
      缩放浏览器窗口体验尺寸变化。断点为 xs 0、sm 576、md 768、lg 992、xl
      1200、xxl 1600，使用当前宽度下已配置的最近一档尺寸。
    </p>
  </div>
</template>
