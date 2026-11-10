<script setup lang="ts">
import { HysTooltip, HysButton, HysBadge } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysTooltip :max-width="280" show-arrow
      ><HysButton variant="secondary">结构化提示内容</HysButton
      ><template #content
        ><div class="demo-stack">
          <HysBadge tone="green">服务正常</HysBadge><strong>最近同步</strong
          ><span>已完成最新配置同步，可以继续操作。</span>
        </div></template
      ></HysTooltip
    >
  </div>
</template>
