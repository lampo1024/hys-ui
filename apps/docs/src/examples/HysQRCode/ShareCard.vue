<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysCopyButton, HysPopover, HysQRCode } from "hys-ui";
const open = ref(false);
const url = "https://example.com/training/check-in";
</script>
<template>
  <div class="demo-stack">
    <strong>仓储安全培训</strong>
    <HysPopover v-model:open="open" aria-label="分享签到入口">
      <template #trigger
        ><HysButton size="sm" variant="secondary"
          >分享签到入口</HysButton
        ></template
      >
      <div class="demo-stack">
        <HysQRCode :value="url" :size="145" aria-label="安全培训签到二维码" />
        <HysCopyButton
          text="https://example.com/training/check-in"
          size="sm"
          label="复制签到地址"
        />
      </div>
    </HysPopover>
  </div>
</template>
