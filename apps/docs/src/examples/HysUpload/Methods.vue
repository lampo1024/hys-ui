<script setup lang="ts">
import { ref } from "vue";
import { HysUpload, HysButton, type HysUploadInstance } from "hys-ui";
const upload = ref<HysUploadInstance>(),
  result = ref("");
async function add() {
  const added = await upload.value?.addFiles([
    new File(["Example content"], "示例附件.txt", { type: "text/plain" }),
  ]);
  result.value = "已添加 " + (added?.length ?? 0) + " 个文件";
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysButton @click="upload?.open()">打开选择器</HysButton
      ><HysButton @click="add">添加模拟文件</HysButton
      ><HysButton
        @click="
          result =
            '当前文件：' +
            upload
              ?.getFiles()
              .map((file) => file.name)
              .join('、')
        "
        >读取文件列表</HysButton
      ><HysButton @click="upload?.focus()">聚焦选择区域</HysButton
      ><HysButton variant="ghost" @click="upload?.clearFiles()"
        >清空附件</HysButton
      >
    </div>
    <HysUpload ref="upload" :open-file-dialog-on-click="false"
      ><template #tip
        >此处关闭区域点击选择，通过外部按钮打开。文件行支持上下方向键、Home /
        End 与 Delete。</template
      ></HysUpload
    ><output class="state-output">{{ result || "等待操作" }}</output>
  </div>
</template>
