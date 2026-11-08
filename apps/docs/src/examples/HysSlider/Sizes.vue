<script setup lang="ts">
import { ref } from "vue";
import { HysSlider } from "hys-ui";
const small = ref(25),
  medium = ref(50),
  large = ref(75);
</script>
<template>
  <div class="demo-content">
    <HysSlider v-model="small" label="小尺寸" size="sm" /><HysSlider
      v-model="medium"
      label="默认尺寸"
    /><HysSlider v-model="large" label="大尺寸" size="lg" />
    <p class="scenario-note">
      滑块支持
      sm、md、lg，也会继承表单尺寸。较小的可见滑块仍保留足够的拖动区域。
    </p>
  </div>
</template>
