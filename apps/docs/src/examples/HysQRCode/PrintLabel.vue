<script setup lang="ts">
import { computed, ref } from "vue";
import { HysCard, HysCheckbox, HysQRCode, provideHysConfig } from "hys-ui";
const dark = ref(false);
const border = ref(false);
provideHysConfig({ theme: computed(() => (dark.value ? "dark" : "blue")) });
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysCheckbox v-model="dark">深色背景</HysCheckbox>
      <HysCheckbox v-model="border">增加静区</HysCheckbox>
    </div>
    <HysCard title="包裹 PKG-2026-042">
      <HysQRCode
        value="PKG-2026-042"
        :margin="border ? 10 : 4"
        error-correction-level="H"
        aria-label="包裹追踪二维码"
      />
    </HysCard>
  </div>
</template>
