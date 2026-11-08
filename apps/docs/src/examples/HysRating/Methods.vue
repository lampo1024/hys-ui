<script setup lang="ts">
import { ref } from "vue";
import { HysRating, HysButton } from "hys-ui";
import type { HysRatingInstance } from "hys-ui";
const control = ref<HysRatingInstance>(),
  score = ref(2),
  result = ref("");
</script>
<template>
  <div class="demo-content">
    <HysRating ref="control" v-model="score" show-score aria-label="实例评分" />
    <div class="demo-row">
      <HysButton variant="secondary" @click="control?.setCurrentValue(5)"
        >预览五分</HysButton
      ><HysButton variant="secondary" @click="control?.resetCurrentValue()"
        >撤销预览</HysButton
      ><HysButton
        variant="secondary"
        @click="control?.setValue(4).then((value) => (result = String(value)))"
        >提交四分</HysButton
      ><HysButton
        variant="secondary"
        @click="control?.clear().then((value) => (result = String(value)))"
        >清空</HysButton
      >
    </div>
    <output>已提交：{{ score }} · 是否接受：{{ result || "尚未操作" }}</output>
  </div>
</template>
