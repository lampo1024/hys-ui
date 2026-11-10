<script setup lang="ts">
import { ref } from "vue";
import {
  HysUpload,
  HysCheckbox,
  type HysUploadFile,
  type HysUploadRequestOptions,
} from "hys-ui";
const files = ref<HysUploadFile[]>([]),
  failFirst = ref(true),
  result = ref("等待选择文件");
const attempts = new Map<string, number>();
function request(options: HysUploadRequestOptions) {
  const attempt = (attempts.get(options.file.uid) ?? 0) + 1;
  attempts.set(options.file.uid, attempt);
  let percentage = 0;
  const timer = setInterval(() => {
    if (options.signal.aborted) {
      clearInterval(timer);
      return;
    }
    percentage += 10;
    options.onProgress(percentage);
    if (percentage >= 100) {
      clearInterval(timer);
      if (failFirst.value && attempt === 1)
        options.onError(new Error("模拟网络中断，请点击重试"));
      else options.onSuccess({ id: options.file.uid });
    }
  }, 150);
  options.signal.addEventListener("abort", () => clearInterval(timer), {
    once: true,
  });
  return () => clearInterval(timer);
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="failFirst" label="首次请求失败" /><HysUpload
      v-model:file-list="files"
      :custom-request="request"
      :concurrency="2"
      :limit="8"
      @success="(_, file) => (result = file.name + ' 上传成功')"
      @upload-error="(error) => (result = error.message)"
      ><template #tip
        >本例在浏览器内模拟请求，显示排队、进度、取消、失败与重试，不发送文件到服务器。</template
      ></HysUpload
    ><output class="state-output">{{ result }}</output>
  </div>
</template>
