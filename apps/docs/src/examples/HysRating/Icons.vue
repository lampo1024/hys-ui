<script setup lang="ts">
import { ref } from "vue";
import { HysRating } from "hys-ui";
import { Heart, Smile, Frown, Meh } from "lucide-vue-next";
const score = ref(3);
</script>
<template>
  <div class="demo-content">
    <div class="rating-demo-grid">
      <div class="rating-demo-field">
        <span>自定义图标</span
        ><HysRating
          v-model="score"
          :icon="Heart"
          color="#e04b7c"
          show-score
          aria-label="爱心评分"
        />
      </div>
      <div class="rating-demo-field">
        <span>分级图标</span
        ><HysRating
          v-model="score"
          :icons="[Frown, Meh, Smile]"
          :colors="['#e5484d', '#e7a008', '#12a878']"
          show-score
          aria-label="表情评分"
        />
      </div>
      <div class="rating-demo-field">
        <span>字符插槽</span
        ><HysRating v-model="score" allow-half aria-label="字符评分"
          ><template #character><span>赞</span></template></HysRating
        >
      </div>
    </div>
    <output>{{ score }}</output>
  </div>
</template>
