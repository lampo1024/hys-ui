<script setup lang="ts">
import { HysTooltip, HysButton } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysTooltip
      ><HysButton variant="secondary">查看提示</HysButton
      ><template #content
        >保存后将更新当前配置，其他项目保持不变。</template
      ></HysTooltip
    >
  </div>
</template>
