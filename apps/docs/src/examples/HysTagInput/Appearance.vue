<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput } from "hys-ui";
const small = ref(["小尺寸"]),
  medium = ref(["标准尺寸"]),
  large = ref(["大尺寸"]),
  outline = ref(["描边标签"]),
  dark = ref(["深色标签"]);
</script>
<template>
  <div class="demo-stack">
    <HysTagInput
      v-model="small"
      size="sm"
      clearable
      aria-label="小尺寸标签"
    /><HysTagInput
      v-model="medium"
      size="md"
      clearable
      aria-label="标准尺寸标签"
    /><HysTagInput
      v-model="large"
      size="lg"
      clearable
      aria-label="大尺寸标签"
    />
    <div class="feedback-demo-grid">
      <HysTagInput
        v-model="outline"
        tag-tone="success"
        tag-effect="outline"
        tag-round
        aria-label="描边标签"
      /><HysTagInput
        v-model="dark"
        tag-tone="warning"
        tag-effect="dark"
        aria-label="深色标签"
      />
    </div>
  </div>
</template>
