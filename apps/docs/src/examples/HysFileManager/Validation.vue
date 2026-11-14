<script setup lang="ts">
import { ref } from "vue";
import {
  HysFileManager,
  type HysFileRejection,
  type ManagedFile,
} from "hys-ui";
const files = ref<ManagedFile[]>([]);
const feedback = ref("");
let nextId = 1;
function add(incoming: File[]) {
  files.value = [
    ...files.value,
    ...incoming.map((file) => ({
      id: String(nextId++),
      name: file.name,
      size: file.size,
    })),
  ];
  feedback.value = "";
}
function reject(rejections: HysFileRejection[]) {
  const messages = {
    type: "格式不符",
    size: "超过 1 MB",
    count: "附件名额已满",
  };
  feedback.value = rejections
    .map(({ file, reason }) => file.name + " · " + messages[reason])
    .join("，");
}
</script>
<template>
  <div class="demo-stack">
    <p class="scenario-note">
      可添加 2 个 CSV 或 TXT 文件，每个文件最大 1 MB。
    </p>
    <HysFileManager
      v-model="files"
      accept=".csv,.txt"
      :max-count="2"
      :max-size="1048576"
      @upload="add"
      @reject="reject"
      @remove="files = files.filter((file) => file.id !== $event)"
      @download="feedback = '已请求下载选中附件。'"
    />
    <output v-if="feedback" class="state-output" aria-live="polite">{{
      feedback
    }}</output>
  </div>
</template>
