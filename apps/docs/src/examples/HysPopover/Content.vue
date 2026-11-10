<script setup lang="ts">
import { HysPopover, HysButton, HysBadge } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysPopover :width="320" show-arrow
      ><template #trigger
        ><HysButton variant="secondary">自定义标题与内容</HysButton></template
      ><template #title
        ><div class="demo-control-actions">
          <strong>服务状态</strong><HysBadge tone="green">正常</HysBadge>
        </div></template
      ><template #default="{ close }"
        ><div class="demo-stack">
          <p>
            内容插槽可以放置状态说明和操作。标题、内容及触发区域都可独立定制。
          </p>
          <HysButton @click="close">知道了</HysButton>
        </div></template
      ></HysPopover
    >
  </div>
</template>
