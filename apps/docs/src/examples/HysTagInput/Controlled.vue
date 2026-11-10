<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput, HysCheckbox, HysButton } from "hys-ui";
const tags = ref(["固定标签"]),
  accept = ref(false),
  requests = ref(0),
  accepted = ref(0);
function update(value: string[]) {
  requests.value++;
  if (accept.value) tags.value = value;
}
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="accept" label="接受标签更新" /><HysTagInput
      :model-value="tags"
      @update:model-value="update"
      @accepted-change="accepted++"
      clearable
      aria-label="受控标签"
    /><output class="state-output"
      >请求 {{ requests }} 次 · 已接受 {{ accepted }} 次 · {{ tags }}</output
    >
    <p class="scenario-note">
      宿主拒绝更新时保留草稿和原列表；兼容的 change/add/remove
      表示请求，acceptedChange 用于成功后的副作用。
    </p>
  </div>
</template>
