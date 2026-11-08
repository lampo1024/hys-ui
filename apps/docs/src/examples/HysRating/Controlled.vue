<script setup lang="ts">
import { ref } from "vue";
import { HysRating, HysCheckbox } from "hys-ui";
const score = ref(2),
  allow = ref(false),
  requested = ref<number | null>(null);
function update(value: number) {
  requested.value = value;
  if (allow.value) score.value = value;
}
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="allow" label="允许提交更新" /><HysRating
      :model-value="score"
      @update:model-value="update"
      show-score
      aria-label="受控评分"
    /><output>实际：{{ score }} · 请求：{{ requested ?? "无" }}</output>
  </div>
</template>
