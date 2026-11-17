<script setup lang="ts">
import { onBeforeUnmount, ref } from "vue";
import { HysButton, HysImageViewer } from "hys-ui";
import original from "../../../../../docs/assets/readme/gantt-dependencies.png";
const large = ref("");
const open = ref(false);
const error = ref("");
let active = true;
onBeforeUnmount(() => {
  active = false;
  if (large.value) URL.revokeObjectURL(large.value);
});
async function view() {
  error.value = "";
  try {
    if (!large.value) {
      const image = new Image();
      image.src = original;
      await image.decode();
      if (!active) return;
      const canvas = document.createElement("canvas");
      canvas.width = 4800;
      canvas.height = Math.round(
        (4800 * image.naturalHeight) / image.naturalWidth,
      );
      const context = canvas.getContext("2d");
      if (!context) throw new Error("浏览器无法生成测试图片");
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!active) return;
      if (!blob) throw new Error("图片转换失败");
      large.value = URL.createObjectURL(blob);
    }
    open.value = true;
  } catch (cause) {
    if (active)
      error.value = cause instanceof Error ? cause.message : "无法加载预览";
  }
}
</script>
<template>
  <div class="demo-stack">
    <div>
      <HysButton :action="view" variant="secondary">预览大图样本</HysButton>
    </div>
    <span v-if="error" role="alert">{{ error }}</span>
    <HysImageViewer
      v-model:open="open"
      :images="{
        src: large,
        alt: '放大后的甘特图截图',
        title: '4800 像素大图',
      }"
    />
  </div>
</template>
