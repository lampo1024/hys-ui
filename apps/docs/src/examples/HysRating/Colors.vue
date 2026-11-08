<script setup lang="ts">
import { ref } from "vue";
import { HysRating } from "hys-ui";
const score = ref(3);
</script>
<template>
  <div class="demo-content">
    <div class="rating-demo-grid">
      <div class="rating-demo-field">
        <span>按等级使用颜色</span
        ><HysRating
          v-model="score"
          :colors="['#e5484d', '#e7a008', '#12a878']"
          show-score
          aria-label="等级颜色"
        />
      </div>
      <div class="rating-demo-field">
        <span>自定义阈值</span
        ><HysRating
          v-model="score"
          :colors="{
            2: '#e5484d',
            4: { value: '#e7a008', excluded: true },
            5: '#12a878',
          }"
          void-color="#dce2ec"
          show-score
          aria-label="阈值颜色"
        />
      </div>
    </div>
    <output>{{ score }}</output>
    <p class="hint">
      数组遵循 lowThreshold 与 highThreshold；对象按阈值递增匹配，excluded
      表示不包含边界。
    </p>
  </div>
</template>
