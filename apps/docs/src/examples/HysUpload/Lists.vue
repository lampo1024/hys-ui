<script setup lang="ts">
import { ref } from "vue";
import {
  HysUpload,
  HysSelect,
  type HysUploadItem,
  type HysUploadListType,
} from "hys-ui";
const listType = ref<HysUploadListType>("picture-card"),
  downloaded = ref("");
const image =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="#dbeafe"/><circle cx="215" cy="55" r="24" fill="#60a5fa"/><path d="M0 180L110 55L230 180M130 180L235 95L320 180" fill="#3b82f6"/></svg>',
  );
const files = ref<HysUploadItem[]>([
  { uid: "cover", name: "封面示意图.svg", url: image },
  { uid: "guide", name: "使用说明.txt", size: 28 },
]);
</script>
<template>
  <div class="demo-stack">
    <label class="demo-control-field"
      ><span>列表样式</span
      ><HysSelect
        v-model="listType"
        :options="
          ['text', 'picture', 'picture-card'].map((value) => ({
            label: value,
            value,
          }))
        " /></label
    ><HysUpload
      v-model:file-list="files"
      :list-type="listType"
      :list-height="300"
      :download-file="
        (file) => {
          downloaded = file.name;
          return false;
        }
      "
      ><template #tip
        >支持图片预览、本地缩略图、服务端文件回填。下载在本例中记录文件名，可替换为业务下载方法。</template
      ></HysUpload
    ><output class="state-output"
      >最近点击下载：{{ downloaded || "暂无" }}</output
    >
  </div>
</template>
