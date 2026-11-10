<script setup lang="ts">
import { ref } from "vue";
import { HysTooltip, HysButton } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysTooltip enterable :hide-delay="200" :max-width="300" show-arrow
      ><HysButton variant="secondary">移入并选择说明文字</HysButton
      ><template #content
        ><p>
          允许将鼠标移入提示内容区。可以选择这段说明文字进行复制，移出触发区域与提示后才会关闭。
        </p></template
      ></HysTooltip
    >
    <p class="scenario-note">
      Tooltip 用于补充说明；包含表单、按钮等操作时使用 Popover。
    </p>
  </div>
</template>
