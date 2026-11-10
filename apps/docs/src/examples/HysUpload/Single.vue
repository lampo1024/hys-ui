<script setup lang="ts">
import { ref } from "vue";
import { HysUpload, type HysUploadFile } from "hys-ui";
const files = ref<HysUploadFile[]>([]);
</script>
<template>
  <div class="demo-stack">
    <HysUpload
      v-model:file-list="files"
      :multiple="false"
      :limit="1"
      accept="image/*"
      list-type="picture"
      ><template #tip
        >只选择一张图片。新文件通过检查后替换旧文件；检查未通过时保留原文件。</template
      ></HysUpload
    ><output class="state-output"
      >当前文件：{{ files[0]?.name || "尚未选择" }}</output
    >
  </div>
</template>
