<script setup lang="ts">
import { ref } from "vue";
import { HysSlider } from "hys-ui";
const count = ref(45),
  range = ref<[number, number]>([20, 80]);
</script>
<template>
  <div class="demo-content">
    <HysSlider v-model="count" label="数量" show-input />
    <HysSlider
      v-model="range"
      label="预算范围"
      show-input
      :show-input-controls="false"
      :step="5"
    />
    <p class="scenario-note">
      数字输入与轨道使用相同的范围和步长。范围两端不会相互越过，可按场景隐藏加减按钮。
    </p>
  </div>
</template>
