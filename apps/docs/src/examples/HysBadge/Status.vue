<script setup lang="ts">
import { HysBadge } from "hys-ui";
</script>
<template>
  <div class="demo-row" style="gap: 24px">
    <HysBadge status="success" text="已完成" /><HysBadge
      status="processing"
      text="处理中"
    /><HysBadge status="default" text="未开始" /><HysBadge
      status="error"
      text="失败"
    /><HysBadge status="warning" text="需关注" /><HysBadge
      status="processing"
      color="#7945d5"
      >自定义颜色</HysBadge
    >
  </div>
  <p class="hint">
    状态点与文字一起表达含义，避免只依赖颜色。处理中动画遵循组件库动效设置和系统减少动态效果偏好。
  </p>
</template>
