<script setup lang="ts">
import { ref } from "vue";
import {
  HysUpload,
  HysCheckbox,
  type HysUploadFile,
  type HysUploadContext,
} from "hys-ui";
const files = ref<HysUploadFile[]>([]),
  transform = ref(false),
  result = ref("");
async function beforeUpload(raw: File, context: HysUploadContext) {
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 500);
    context.signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        resolve();
      },
      { once: true },
    );
  });
  if (context.signal.aborted) return false;
  if (raw.name.toLowerCase().includes("reject"))
    throw new Error("文件名包含 reject，请更换文件");
  result.value = "检查通过：" + raw.name;
  return transform.value
    ? new File([await raw.text(), "\nChecked by Upload"], raw.name, {
        type: raw.type,
      })
    : true;
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="transform" label="检查后附加文本" /><HysUpload
      v-model:file-list="files"
      accept=".txt,.csv"
      :max-size="1048576"
      :limit="3"
      :before-upload="beforeUpload"
      @error="(message) => (result = message)"
      @exceed="() => (result = '最多选择 3 个文件')"
      ><template #tip
        >接受 TXT / CSV，每个文件不超过 1 MB，最多 3 个。异步检查约 0.5
        秒，文件名含 reject 时拒绝。返回 File / Blob
        可替换实际发送内容，列表保留原始 File。</template
      ></HysUpload
    ><output class="state-output">{{ result || "等待文件检查" }}</output>
  </div>
</template>
