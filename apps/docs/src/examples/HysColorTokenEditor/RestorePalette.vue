<script setup lang="ts">
import { ref } from "vue";
import { HysColorTokenEditor } from "hys-ui";
const colors = ref({
  primary: "#7854ce",
  accent: "#d97706",
  surface: "#f6f1ff",
});
const defaults = { primary: "#3674e9", accent: "#15803d", surface: "#ffffff" };
const changed = ref<string[]>([]);
</script>

<template>
  <div class="demo-stack">
    <HysColorTokenEditor
      v-model="colors"
      :labels="{ primary: '品牌主色', accent: '强调色', surface: '页面底色' }"
      :defaults="defaults"
      :locked-keys="['surface']"
      reset-all
      @reset="changed = $event"
    />
    <output v-if="changed.length" class="state-output"
      >已恢复 {{ changed.length }} 项颜色</output
    >
  </div>
</template>
