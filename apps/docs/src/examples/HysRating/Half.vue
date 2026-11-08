<script setup lang="ts">
import { ref } from "vue";
import { HysRating } from "hys-ui";
const score = ref(2.5);
</script>
<template>
  <div class="demo-content">
    <div class="rating-demo-field">
      <span>半分选择</span
      ><HysRating v-model="score" allow-half show-score aria-label="半分评分" />
    </div>
    <div class="rating-demo-field">
      <span>精确展示已有小数</span
      ><HysRating
        :model-value="3.7"
        readonly
        show-score
        score-template="{value} 分"
        aria-label="小数展示"
      />
    </div>
    <output>{{ score }}</output>
    <p class="hint">
      点击图形左半侧或右半侧选择半分或整分；只读评分可展示任意小数。
    </p>
  </div>
</template>
