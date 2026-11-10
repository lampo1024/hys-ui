<script setup lang="ts">
import { ref } from "vue";
import { HysUpload, HysCheckbox, type HysUploadFile } from "hys-ui";
const files = ref<HysUploadFile[]>([]),
  directory = ref(false),
  pasted = ref(0),
  dropped = ref(0);
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="directory" label="使用目录选择器" /><HysUpload
      v-model:file-list="files"
      :directory="directory"
      paste
      :limit="30"
      @paste="pasted++"
      @drop="dropped++"
      ><template #tip
        >拖入文件，或聚焦上传区域后粘贴剪贴板中的图片/文件。目录选择依赖浏览器的
        webkitdirectory 支持，relativePath 保留目录内的路径。</template
      ><template #file="{ file }"
        ><span :title="file.relativePath || file.name">{{
          file.relativePath || file.name
        }}</span></template
      ></HysUpload
    ><output class="state-output"
      >拖入 {{ dropped }} 次 · 粘贴 {{ pasted }} 次 · 文件
      {{ files.length }} 个</output
    >
  </div>
</template>
