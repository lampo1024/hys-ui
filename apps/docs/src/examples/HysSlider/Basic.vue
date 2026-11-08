<script setup lang="ts">
import { ref } from "vue";
import { HysSlider } from "hys-ui";
const slider = ref(60);
</script>
<template>
  <div class="demo-content">
    <HysSlider v-model="slider" label="任务完成率" />
  </div>
</template>
