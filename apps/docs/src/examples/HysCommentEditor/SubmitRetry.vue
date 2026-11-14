<script setup lang="ts">
import { ref } from "vue";
import { HysCommentEditor, type Comment } from "hys-ui";
const draft = ref("已核对这批订单。"),
  comments = ref<Comment[]>([]);
let attempts = 0;
async function submit(_: string, signal: AbortSignal) {
  await new Promise((resolve) => setTimeout(resolve, 350));
  if (!signal.aborted && attempts++ === 0) throw new Error("网络暂不可用");
}
function add(text: string) {
  comments.value = [
    ...comments.value,
    { id: String(attempts), author: "审核员", text, removable: false },
  ];
}
</script>

<template>
  <HysCommentEditor
    v-model:draft="draft"
    :comments="comments"
    :submit="submit"
    @send="add"
  />
</template>
