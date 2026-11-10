<script setup lang="ts">
import { HysEmpty, HysButton } from "hys-ui";
const image =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><rect x="12" y="15" width="76" height="48" rx="6" fill="#e7efff"/><path d="M30 35h40M30 45h25" stroke="#3867f5" stroke-width="4"/></svg>',
  );
</script>
<template>
  <div class="demo-stack">
    <HysEmpty
      :image="image"
      image-alt="空文件夹示意图"
      title="文件夹为空"
      description="可以上传文件，或创建新的子文件夹。"
      role="status"
      aria-live="polite"
      aria-label="文件夹内容"
      ><HysButton>上传文件</HysButton></HysEmpty
    >
    <p class="scenario-note">
      默认图标为装饰性内容；有信息意义的图片可设置 imageAlt。自动播报由 ariaLive
      显式开启，组件默认不创建实时通知区域。
    </p>
  </div>
</template>
