<script setup lang="ts">
import { ref } from "vue";
import {
  HysUpload,
  HysCheckbox,
  type HysUploadItem,
  type HysUploadContext,
} from "hys-ui";
const protect = ref(true),
  files = ref<HysUploadItem[]>([
    { uid: "protected", name: "受保护的原始文件.pdf", status: "success" },
    { uid: "temporary", name: "可移除的临时附件.txt", status: "success" },
  ]),
  result = ref("");
async function beforeRemove(
  file: HysUploadItem,
  _files: readonly HysUploadItem[],
  context: HysUploadContext<HysUploadItem>,
) {
  await new Promise<void>((resolve) => {
    const timer = setTimeout(resolve, 600);
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
  if (protect.value && file.uid === "protected") {
    result.value = "原始文件已受保护";
    return false;
  }
  result.value = "已允许移除：" + file.name;
  return true;
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="protect" label="保护原始文件" /><HysUpload
      v-model:file-list="files"
      :before-remove="beforeRemove"
      :show-download="false"
      ><template #tip
        >移除前可检查业务权限，返回 false
        保留文件。清空列表会取消正在等待的检查。</template
      ></HysUpload
    ><output class="state-output">{{
      result || "点击文件右侧的移除按钮"
    }}</output>
  </div>
</template>
