<script setup lang="ts">
import { HysAlert, type HysAlertEffect } from "hys-ui";
const effects: HysAlertEffect[] = ["light", "dark", "outline"];
</script>
<template>
  <div class="demo-stack">
    <div v-for="effect in effects" :key="effect" class="demo-stack">
      <span class="scenario-note">{{ effect }}</span
      ><HysAlert
        tone="primary"
        :effect="effect"
        title="主题提示"
        description="使用当前主题色，可结合浅色、深色或描边外观。"
        show-icon
      /><HysAlert
        tone="warning"
        :effect="effect"
        title="操作提醒"
        description="有需要注意的信息，请确认后继续。"
        show-icon
      />
    </div>
    <HysAlert
      banner
      title="横幅提示"
      description="适合页面顶部或内容区域的连续通知。"
      closable
    />
    <div class="feedback-demo-grid">
      <HysAlert
        v-for="size in ['sm', 'md', 'lg'] as const"
        :key="size"
        :size="size"
        :title="size + ' 尺寸'"
        show-icon
      />
    </div>
  </div>
</template>
