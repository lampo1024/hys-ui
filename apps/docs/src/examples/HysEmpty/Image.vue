<script setup lang="ts">
import { ref } from "vue";
import { HysEmpty, HysButton, HysInput } from "hys-ui";
import { ImageOff } from "lucide-vue-next";
const sample =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="180" height="100"><rect x="15" y="10" width="150" height="75" rx="10" fill="#e7efff"/><path d="M40 65h100M55 40h70" stroke="#3867f5" stroke-width="7" stroke-linecap="round"/></svg>',
  );
const image = ref(sample),
  loads = ref(0),
  errors = ref(0),
  api = ref<import("hys-ui").HysEmptyInstance>();
</script>
<template>
  <div class="demo-stack">
    <label class="demo-field"
      >图片地址<HysInput
        v-model="image"
        placeholder="http(s)、blob 或 data:image URL"
    /></label>
    <div class="demo-control-actions">
      <HysButton @click="image = sample">使用示例图片</HysButton
      ><HysButton @click="image = 'data:image/png;base64,broken'"
        >模拟加载失败</HysButton
      ><HysButton @click="api?.retryImage()">重试图片</HysButton>
    </div>
    <HysEmpty
      ref="api"
      :image="image"
      :image-size="120"
      :image-style="{ width: '180px', height: '100px' }"
      title="自定义图片"
      description="图片失败时可自定义回退内容。"
      @image-load="loads++"
      @image-error="errors++"
      ><template #fallback
        ><ImageOff :size="56" aria-hidden="true" /></template></HysEmpty
    ><output class="state-output"
      >加载成功 {{ loads }} 次 · 失败 {{ errors }} 次</output
    >
  </div>
</template>
