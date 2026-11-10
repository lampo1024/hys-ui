<script setup lang="ts">
import { HysUpload, type HysUploadItem } from "hys-ui";
const files: HysUploadItem[] = [
  {
    uid: "report",
    name: "只读附件及较长的文件名称用于检查窄容器内的截断和操作布局.pdf",
    status: "success",
    size: 4096,
  },
];
</script>
<template>
  <div class="demo-stack">
    <div>
      <p class="scenario-note">禁用选择与列表修改</p>
      <HysUpload disabled :default-file-list="files" />
    </div>
    <div>
      <p class="scenario-note">只读列表</p>
      <HysUpload readonly :default-file-list="files" />
    </div>
    <div>
      <p class="scenario-note">加载状态</p>
      <HysUpload loading />
    </div>
    <div>
      <p class="scenario-note">空列表与错误反馈</p>
      <HysUpload error="请选择必要附件"
        ><template #empty>尚未添加附件，支持键盘聚焦选择。</template></HysUpload
      >
    </div>
  </div>
</template>
