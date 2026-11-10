<script setup lang="ts">
import { ref } from "vue";
import { HysProgress, HysNumberInput } from "hys-ui";
const completed = ref(35),
  total = 200;
</script>
<template>
  <div class="demo-stack">
    <label class="demo-field"
      >已完成任务<HysNumberInput v-model="completed" :min="0" :max="total"
    /></label>
    <p id="progress-accessibility-help" class="scenario-note">
      此进度显示任务完成数量，使用屏幕阅读器可获取完整说明。
    </p>
    <HysProgress
      :value="(completed / total) * 100"
      aria-label="后台任务"
      aria-describedby="progress-accessibility-help"
      :aria-value-text="() => completed + ' 项已完成，共 ' + total + ' 项'"
      :format="() => completed + ' / ' + total + ' 项'"
    /><output class="state-output"
      >已完成 {{ completed }} / {{ total }} 项</output
    >
  </div>
</template>
