<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysInput,
  HysNumberInput,
  HysQRCode,
  type HysQRCodeExportFormat,
} from "hys-ui";
const value = ref("https://example.com/check-in");
const pixels = ref<number | null>(512);
const qr = ref<InstanceType<typeof HysQRCode>>();
const feedback = ref("");
async function download(format: HysQRCodeExportFormat) {
  const blob = await qr.value?.exportImage(format, pixels.value ?? 512);
  if (!blob) {
    feedback.value = "当前内容无法导出";
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "event-check-in." + format;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  feedback.value = "已生成 " + format.toUpperCase() + " 文件";
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-row">
      <HysInput v-model="value" label="签到地址" />
      <HysNumberInput
        v-model="pixels"
        :min="128"
        :max="2048"
        :step="64"
        label="导出边长（像素）"
      />
    </div>
    <HysQRCode ref="qr" :value="value" :size="132">
      <template #details="{ version, modules, correction }">
        <small
          >V{{ version }} · {{ modules }} × {{ modules }} 模块 ·
          {{ correction }} 纠错</small
        >
      </template>
    </HysQRCode>
    <div class="demo-row">
      <HysButton size="sm" :disabled="!value" @click="download('png')"
        >下载 PNG</HysButton
      >
      <HysButton
        size="sm"
        variant="secondary"
        :disabled="!value"
        @click="download('svg')"
        >下载 SVG</HysButton
      >
    </div>
    <span role="status">{{ feedback }}</span>
  </div>
</template>
