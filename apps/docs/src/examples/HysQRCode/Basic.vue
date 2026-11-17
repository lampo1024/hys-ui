<script setup lang="ts">
import { ref } from "vue";
import { HysInput, HysQRCode } from "hys-ui";
const link = ref("https://example.com/attendance");
</script>

<template>
  <div class="demo-stack">
    <HysInput v-model="link" label="签到链接" clearable />
    <HysQRCode :value="link" aria-label="签到二维码" />
  </div>
</template>
