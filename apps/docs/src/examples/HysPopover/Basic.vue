<script setup lang="ts">
import { HysPopover, HysButton } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysPopover title="操作详情"
      ><template #trigger
        ><HysButton variant="secondary">打开浮层</HysButton></template
      >
      <p>这里适合放置说明和轻量操作。点击外部或按 Escape 关闭。</p></HysPopover
    >
  </div>
</template>
