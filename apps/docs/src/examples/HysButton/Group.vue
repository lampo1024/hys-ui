<script setup lang="ts">
import { ref } from "vue";
import { AlignCenter, AlignLeft, AlignRight } from "lucide-vue-next";
import { HysButton, HysButtonGroup } from "hys-ui";
const selected = ref("左对齐");
const options = [
  { label: "左对齐", icon: AlignLeft },
  { label: "居中", icon: AlignCenter },
  { label: "右对齐", icon: AlignRight },
];
</script>

<template>
  <HysButtonGroup type="default" size="small" aria-label="对齐方式">
    <HysButton v-for="option in options" :key="option.label" :icon="option.icon"
      :pressed="selected === option.label" @click="selected = option.label">{{ option.label }}</HysButton>
  </HysButtonGroup>
</template>
