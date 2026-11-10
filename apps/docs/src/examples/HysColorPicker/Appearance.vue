<script setup lang="ts">
import { ref } from "vue";
import { HysColorPicker } from "hys-ui";
const small = ref("#3867f5"),
  medium = ref("#22a06b"),
  large = ref("#8955ea"),
  compact = ref("#f59e0b");
</script>
<template>
  <div class="demo-stack">
    <HysColorPicker
      v-model="small"
      size="sm"
      label="小尺寸颜色"
    /><HysColorPicker
      v-model="medium"
      size="md"
      label="标准颜色"
    /><HysColorPicker
      v-model="large"
      size="lg"
      label="大尺寸颜色"
    /><HysColorPicker
      v-model="compact"
      :show-input="false"
      show-text
      label="紧凑颜色"
    />
  </div>
</template>
