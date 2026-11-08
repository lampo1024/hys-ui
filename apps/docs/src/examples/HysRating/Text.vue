<script setup lang="ts">
import { ref } from "vue";
import { HysRating } from "hys-ui";
const score = ref(3),
  preview = ref<number | null>(null),
  texts = ["非常不满意", "不满意", "一般", "满意", "非常满意"];
</script>
<template>
  <div class="demo-content">
    <HysRating
      v-model="score"
      :texts="texts"
      show-text
      v-model:hover-value="preview"
      aria-label="文字评分"
    /><HysRating
      :model-value="score"
      readonly
      show-score
      score-template="得分 {value} / 5"
    /><output>已提交：{{ score }} · 预览：{{ preview ?? "无" }}</output>
  </div>
</template>
