<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysInputOtp } from "hys-ui";
const pin = ref("4906");
const failed = ref(false);
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="failed">模拟验证失败</HysCheckbox>
    <HysInputOtp v-model="pin" :length="4" :success="pin === '4906'" :error="failed" aria-label="设备配对码" />
  </div>
</template>
