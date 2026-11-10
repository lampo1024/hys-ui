<script setup lang="ts">
import { HysEmpty } from "hys-ui";
</script>
<template>
  <div class="feedback-demo-grid">
    <HysEmpty
      illustration="inbox"
      title="默认图标"
      description="保留原有 Inbox 外观"
      :image-size="72"
    /><HysEmpty
      illustration="simple"
      title="简洁图标"
      description="适合紧凑的列表区域"
      :image-size="72"
    /><HysEmpty
      illustration="default"
      title="完整插图"
      description="使用主题色与中性背景"
      :image-size="120"
    />
  </div>
</template>
