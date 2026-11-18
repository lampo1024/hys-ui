<script setup lang="ts">
import { ref } from "vue";
import { HysBarcode, HysButton, HysSegmented } from "hys-ui";
const label = ref<{exportImage: (type: "svg" | "png") => Promise<Blob | null>}>();
const position = ref<"top" | "bottom">("top");
const positions = [{ value: "top", label: "文字在条纹上方" }, { value: "bottom", label: "文字在条纹下方" }] as const;
async function download(format: "svg" | "png") {
  const blob = await label.value?.exportImage(format);
  if (!blob) return;
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "warehouse-label." + format;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 800);
}
</script>

<template>
  <div class="demo-stack">
    <HysSegmented v-model="position" :options="positions" aria-label="条码文字位置" />
    <HysBarcode ref="label" value="LAB-0738" format="CODE39" label :text-position="position" caption="仓储货架 · A 区" />
    <div class="demo-row">
      <HysButton size="sm" variant="secondary" @click="download('svg')">下载 SVG</HysButton>
      <HysButton size="sm" variant="secondary" @click="download('png')">下载 PNG</HysButton>
    </div>
  </div>
</template>
