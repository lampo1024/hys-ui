<script setup lang="ts">
import { computed, ref } from "vue";
import { HysCheckbox, HysInput, HysQRCode } from "hys-ui";
const name = ref("Workshop-Guest");
const password = ref("demo-guest-2026");
const openNetwork = ref(false);
const escape = (value: string) => value.replace(/[\\;,":]/gu, "\\$&");
const encoded = computed(() =>
  name.value.trim()
    ? "WIFI:T:" +
      (openNetwork.value ? "nopass" : "WPA") +
      ";S:" +
      escape(name.value) +
      (openNetwork.value ? "" : ";P:" + escape(password.value)) +
      ";;"
    : "",
);
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysInput v-model="name" label="访客网络名称" />
      <HysInput
        v-model="password"
        label="访客密码"
        type="password"
        :disabled="openNetwork"
      />
    </div>
    <HysCheckbox v-model="openNetwork">开放网络</HysCheckbox>
    <HysQRCode
      :value="encoded"
      aria-label="访客无线网络二维码"
      :size="138"
      error-correction-level="Q"
    />
    <small
      >手机扫码可读取网络配置。示例值用于展示，二维码会包含输入的访客密码。</small
    >
  </div>
</template>
