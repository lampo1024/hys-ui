<script setup lang="ts">
import { HysAlert, HysButton } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysAlert
      title="禁止关闭的提示"
      description="disabled 只禁止关闭操作，内容仍可阅读。"
      closable
      disabled
      show-icon
    /><HysAlert title="只有标题的提示" center /><HysAlert
      description="没有标题时，正文不会留出空白标题区域。"
    />
    <div style="max-width: 360px">
      <HysAlert
        title="较长的提示标题也应自然换行，避免挤压关闭入口与操作区"
        description="较长的正文与多个操作可以在窄容器内正常排版。"
        closable
        show-icon
        ><template #action
          ><HysButton size="sm">继续操作</HysButton
          ><HysButton size="sm" variant="ghost">稍后处理</HysButton></template
        ></HysAlert
      >
    </div>
  </div>
</template>
