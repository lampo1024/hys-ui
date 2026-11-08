<script setup lang="ts">
import { ref } from "vue";
import { HysRating } from "hys-ui";
const score = ref(2),
  labels = ["不满意", "待改进", "一般", "满意", "非常满意"];
</script>
<template>
  <div class="demo-content">
    <HysRating v-model="score" :tooltips="labels" aria-label="悬停说明评分"
      ><template #text="{ value }"
        ><span
          >{{ labels[Math.ceil(value) - 1] || "尚未评分" }} ·
          {{ value }} 分</span
        ></template
      ></HysRating
    >
    <p class="hint">
      各项说明通过原生 title 提供；text 插槽可组合分值与业务文案。
    </p>
  </div>
</template>
