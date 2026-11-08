<script setup lang="ts">
import { ref } from "vue";
import { HysRating } from "hys-ui";
const score = ref(3);
</script>
<template>
  <div class="demo-content">
    <div class="demo-stack">
      <HysRating
        v-for="size in ['sm', 'md', 'lg'] as const"
        :key="size"
        v-model="score"
        :size="size"
        :aria-label="size + ' 尺寸评分'"
        show-score
      /><HysRating
        v-model="score"
        :icon-size="36"
        aria-label="自定义尺寸评分"
        show-score
      />
    </div>
    <output>{{ score }}</output>
  </div>
</template>
