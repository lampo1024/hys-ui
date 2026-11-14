<script setup lang="ts">
import { ref } from "vue";
import { HysCommentEditor, type Comment } from "hys-ui";
const draft = ref("已复核本批物料。");
const comments = ref<Comment[]>([
  {
    id: "system",
    author: "系统记录",
    text: "工单已转交给仓储团队。",
    removable: false,
  },
]);
let nextId = 1;
function add(text: string) {
  comments.value = [
    ...comments.value,
    { id: String(nextId++), author: "当前用户", text },
  ];
}
</script>
<template>
  <HysCommentEditor
    v-model:draft="draft"
    :comments="comments"
    :max-length="40"
    @send="add"
    @remove="comments = comments.filter((item) => item.id !== $event)"
  />
</template>
