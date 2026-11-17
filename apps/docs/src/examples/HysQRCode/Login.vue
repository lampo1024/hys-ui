<script setup lang="ts">
import { computed, nextTick, ref } from "vue";
import { HysButton, HysQRCode, type HysQRCodeStatus } from "hys-ui";
const status = ref<HysQRCodeStatus>("active");
const session = ref(1);
const value = computed(
  () => "https://example.com/device-login/demo-" + session.value,
);
async function refresh() {
  status.value = "loading";
  await nextTick();
  await new Promise((resolve) => setTimeout(resolve, 500));
  session.value++;
  status.value = "active";
}
</script>
<template>
  <div class="demo-stack">
    <HysQRCode :value="value" :status="status" :size="172" @refresh="refresh" />
    <div class="demo-row">
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="status === 'loading'"
        @click="status = 'expired'"
        >模拟过期</HysButton
      >
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="status !== 'active'"
        @click="status = 'scanned'"
        >模拟扫码</HysButton
      >
      <HysButton
        size="sm"
        variant="text"
        :disabled="status === 'loading'"
        @click="refresh"
        >生成新会话</HysButton
      >
    </div>
    <span role="status">登录会话 {{ session }}</span>
  </div>
</template>
