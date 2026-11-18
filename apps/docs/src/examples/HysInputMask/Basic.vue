<script setup lang="ts">
import { ref } from "vue";
import { HysInputMask } from "hys-ui";
const phone = ref("13800001234");
</script>

<template>
  <div class="demo-stack">
    <HysInputMask v-model="phone" clearable aria-label="收货手机号" placeholder="手机号" />
    <p aria-live="polite">传给业务的值 {{ phone || "空" }}</p>
  </div>
</template>
