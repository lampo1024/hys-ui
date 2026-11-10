<script setup lang="ts">
import { ref } from "vue";
import { HysUpload, HysCheckbox, type HysUploadItem } from "hys-ui";
const files = ref<HysUploadItem[]>([
    { uid: "existing", name: "服务器已有文件.pdf", size: 2048 },
  ]),
  locked = ref(false),
  result = ref("");
function update(next: HysUploadItem[]) {
  result.value = locked.value ? "已拒绝本次文件列表更新" : "已接受更新";
  if (!locked.value)
    files.value = next
      .map((file) => ({ ...file }))
      .sort((a, b) => a.name.localeCompare(b.name));
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="locked" label="拒绝列表更新" /><HysUpload
      :file-list="files"
      :show-download="false"
      @update:file-list="update"
      ><template #tip
        >已有文件只需 uid 和 name；url
        可用于预览或下载。调用方可拒绝添加、移除和清空，也可调整顺序并附加业务数据。</template
      ></HysUpload
    ><output class="state-output"
      >{{ result || "等待操作" }} · {{ files.length }} 个文件</output
    >
  </div>
</template>
