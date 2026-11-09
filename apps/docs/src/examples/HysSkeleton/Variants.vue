<script setup lang="ts">
import { HysSkeleton } from "hys-ui";
</script>
<template>
  <div class="skeleton-variants">
    <label>文字<HysSkeleton variant="text" width="75%" /></label
    ><label>圆形<HysSkeleton variant="circle" :width="48" :height="48" /></label
    ><label>按钮<HysSkeleton variant="button" /></label
    ><label>输入框<HysSkeleton variant="input" /></label
    ><label>矩形<HysSkeleton variant="rect" :height="90" /></label
    ><label>图片<HysSkeleton variant="image" :height="90" /></label>
  </div>
</template>
<style scoped>
.skeleton-variants {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 220px), 1fr));
  gap: 24px;
}
.skeleton-variants label {
  display: grid;
  align-content: start;
  gap: 12px;
  font-size: 12px;
  color: var(--docs-muted);
}
</style>
