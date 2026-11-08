<script setup lang="ts">
import { HysRating } from "hys-ui";
</script>
<template>
  <div class="demo-content">
    <div class="demo-stack">
      <HysRating
        :model-value="3.7"
        readonly
        show-score
        aria-label="只读评分"
      /><HysRating
        :model-value="3"
        disabled
        show-score
        aria-label="禁用评分"
      /><HysRating
        :model-value="0"
        error="请选择评分"
        aria-label="错误评分"
      /><HysRating :max="0" aria-label="零个评分项" /><HysRating
        :model-value="null"
        show-score
        aria-label="空值评分"
      />
    </div>
    <p class="hint">
      只读仍可聚焦；禁用从 Tab
      顺序移除。非法或超出范围的外部值仅规范显示，不自动改写数据。
    </p>
  </div>
</template>
