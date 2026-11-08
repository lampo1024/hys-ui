<script setup lang="ts">
import { ref } from "vue";
import { HysAvatarGroup, HysButton, type HysAvatarOption } from "hys-ui";
const members = ref<HysAvatarOption[]>([
  { key: 1, name: "张明" },
  { key: 2, name: "Lisa" },
  { key: 3, name: "David" },
]);
let next = 4;
function add() {
  members.value.push({ key: next, name: "成员 " + next });
  next++;
}
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton size="sm" variant="secondary" @click="add">添加成员</HysButton
      ><HysButton
        size="sm"
        variant="secondary"
        :disabled="!members.length"
        @click="members.pop()"
        >移除末位</HysButton
      >
    </div>
    <HysAvatarGroup
      :options="members"
      :max-count="2"
      trigger="click"
      aria-label="动态团队"
    /><output class="state-output">当前 {{ members.length }} 位成员</output>
  </div>
</template>
