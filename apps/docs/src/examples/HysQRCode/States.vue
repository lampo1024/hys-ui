<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysQRCode,
  HysSelect,
  type HysQRCodeCorrection,
} from "hys-ui";
const level = ref<HysQRCodeCorrection>("Q");
const contact = "陈晨 · 配送支持";
const content = ref(contact);
const levels = [
  { value: "L", label: "L · 低" },
  { value: "M", label: "M · 中" },
  { value: "Q", label: "Q · 较高" },
  { value: "H", label: "H · 高" },
];
</script>

<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysSelect
        v-model="level"
        :options="levels"
        aria-label="纠错等级"
        style="width: 132px"
      />
      <HysButton variant="secondary" @click="content = contact"
        >载入名片</HysButton
      >
      <HysButton variant="secondary" @click="content = '长'.repeat(3000)"
        >载入超长内容</HysButton
      >
    </div>
    <HysQRCode
      :value="content"
      :error-correction-level="level"
      :size="184"
      foreground="#123456"
    />
  </div>
</template>
