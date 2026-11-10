<script setup lang="ts">
import { ref } from "vue";
import {
  HysUpload,
  HysButton,
  type HysUploadFile,
  type HysUploadInstance,
  type HysUploadRequestOptions,
} from "hys-ui";
const files = ref<HysUploadFile[]>([]),
  upload = ref<HysUploadInstance>();
function request(options: HysUploadRequestOptions) {
  let percent = 0;
  const timer = setInterval(() => {
    percent += 20;
    options.onProgress(percent);
    if (percent >= 100) {
      clearInterval(timer);
      options.onSuccess({ saved: true });
    }
  }, 220);
  options.signal.addEventListener("abort", () => clearInterval(timer), {
    once: true,
  });
  return () => clearInterval(timer);
}
</script>
<template>
  <div class="demo-stack">
    <HysUpload
      ref="upload"
      v-model:file-list="files"
      :drag="false"
      :auto-upload="false"
      :custom-request="request"
      :concurrency="1"
      :show-toolbar="false"
      ><template #trigger="{ disabled }"
        ><HysButton :disabled="disabled">添加待上传文件</HysButton></template
      ><template #tip
        >先添加多个文件，再统一提交。每次仅处理一个请求，可在排队或上传时取消。</template
      ></HysUpload
    >
    <div class="demo-control-actions">
      <HysButton
        :disabled="
          !files.some(
            (file) => file.status === 'ready' || file.status === 'error',
          )
        "
        @click="upload?.submit()"
        >提交上传</HysButton
      ><HysButton
        :disabled="!upload?.uploading && !upload?.queued"
        @click="upload?.abort()"
        >取消全部</HysButton
      ><HysButton variant="ghost" @click="upload?.clearFiles(['success'])"
        >清理已完成</HysButton
      >
    </div>
    <output class="state-output"
      >正在处理 {{ upload?.uploading ?? 0 }} 项 · 等待
      {{ upload?.queued ?? 0 }} 项 · 已完成
      {{ files.filter((file) => file.status === "success").length }} 项</output
    >
  </div>
</template>
