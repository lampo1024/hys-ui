<script setup lang="ts">
import { ref } from "vue";
import { HysRating } from "hys-ui";
const score = ref(3);
</script>
<template>
  <div class="demo-content">
    <div class="rating-demo-field">
      <span>为本次体验评分</span
      ><HysRating v-model="score" aria-label="体验评分" show-score />
    </div>
    <div class="rating-demo-field">
      <span>非受控初值</span
      ><HysRating :default-value="2" aria-label="非受控评分" show-score />
    </div>
    <output>已提交：{{ score }}</output>
  </div>
</template>
