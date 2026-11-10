<script setup lang="ts">
import { HysEmpty, HysButton } from "hys-ui";
</script>
<template>
  <div class="demo-stack">
    <HysEmpty
      size="sm"
      title="紧凑空态"
      description="适合表格、下拉列表或侧栏。"
    /><HysEmpty
      :image="false"
      title="仅显示文字"
      description="可以按场景隐藏图片、标题或说明。"
    /><HysEmpty :title="false" :description="false"
      ><HysButton>创建内容</HysButton></HysEmpty
    >
    <div style="max-width: 260px">
      <HysEmpty
        title="较长的标题会在窄容器中自然换行，保持文字完整"
        description="说明文字与操作区不会把容器撑宽。"
        ><HysButton>新建内容</HysButton
        ><HysButton variant="ghost">了解更多</HysButton></HysEmpty
      >
    </div>
  </div>
</template>
