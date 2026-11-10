<script setup lang="ts">
import { ref } from "vue";
import { HysUpload } from "hys-ui";
import type { HysUploadFile } from "hys-ui";
const files = ref<HysUploadFile[]>([]);
</script>
<template>
  <div class="demo-stack">
    <HysUpload v-model:file-list="files" :limit="5"
      ><template #tip
        >最多选择 5 个文件。也可以将文件拖入选择区域。</template
      ></HysUpload
    ><output class="state-output"
      >已选择 {{ files.length }} 个文件：{{
        files.map((file) => file.name).join("、") || "暂无"
      }}</output
    >
    <p class="scenario-note">
      未配置 action 或 customRequest 时，只管理本地文件，通过 select / change
      交给业务层处理。
    </p>
  </div>
</template>
