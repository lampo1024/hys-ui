<script setup lang="ts">
import { ref } from "vue";
import { HysUpload, HysButton, HysBadge, type HysUploadFile } from "hys-ui";
import { Paperclip, Trash2 } from "lucide-vue-next";
const files = ref<HysUploadFile[]>([]);
</script>
<template>
  <div class="demo-stack">
    <HysUpload v-model:file-list="files" :drag="false" :show-toolbar="false"
      ><template #trigger="{ disabled }"
        ><HysButton :disabled="disabled"
          ><Paperclip :size="16" />添加附件</HysButton
        ></template
      ><template #tip
        >trigger、tip、toolbar、file、item、progress、preview
        可独立定制。</template
      ><template #item="{ file, actions, busy }"
        ><div class="upload-demo-item">
          <Paperclip :size="18" /><span :title="file.name">{{ file.name }}</span
          ><HysBadge>本地附件</HysBadge
          ><HysButton
            variant="ghost"
            size="sm"
            :disabled="busy"
            :aria-label="'删除' + file.name"
            @click="actions.remove()"
            ><Trash2 :size="14"
          /></HysButton></div></template></HysUpload
    ><output class="state-output">共 {{ files.length }} 个附件</output>
  </div>
</template>
<style scoped>
.upload-demo-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  min-width: 0;
}
.upload-demo-item > span {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
