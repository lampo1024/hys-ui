<script setup lang="ts">
import { ref } from "vue";
import { HysRating, HysButton } from "hys-ui";
import type { HysRatingInstance } from "hys-ui";
const score = ref(2),
  control = ref<HysRatingInstance>();
</script>
<template>
  <div class="demo-content">
    <HysButton variant="secondary" @click="control?.focus()">聚焦评分</HysButton
    ><HysRating
      ref="control"
      v-model="score"
      allow-half
      aria-label="键盘评分"
      :format-value-text="(value) => value + ' 分，满分五分'"
      show-score
    /><output>{{ score }}</output>
    <p class="hint">
      方向键调整半分；Home / End 定位零分与满分；允许清空时 Delete / Backspace
      清零。Tab 仅停留一次。
    </p>
  </div>
</template>
