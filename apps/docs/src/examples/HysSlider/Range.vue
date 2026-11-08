<script setup lang="ts">
import { ref } from "vue";
import { HysSlider } from "hys-ui";
const value = ref<[number, number]>([20, 70]);
</script>
<template>
  <div class="demo-content">
    <HysSlider
      v-model="value"
      label="范围"
      :step="5"
      :marks="{ 0: '0', 50: '50', 100: '100' }"
      draggable-track
      show-stops
    /><output class="state-output">{{ value.join(" ~ ") }}</output>
    <p class="scenario-note">
      拖动任意端点调整边界，也可拖动中间已选轨道整体移动区间。区间两端保持有序，到达边界后停止。
    </p>
  </div>
</template>
