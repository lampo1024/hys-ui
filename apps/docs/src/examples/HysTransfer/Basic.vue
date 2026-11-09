<script setup lang="ts">
import { ref } from "vue";
import { HysTransfer } from "hys-ui";
const members = ref<string[]>(["lisa"]);
</script>
<template>
  <div class="demo-content">
    <HysTransfer
      v-model="members"
      :options="[
        { label: 'Keller', value: 'keller' },
        { label: 'Lisa', value: 'lisa' },
        { label: 'David', value: 'david' },
        { label: 'Amy', value: 'amy' },
      ]"
    />
  </div>
  <output>已选择：{{ members.join("、") || "无" }}</output>
  <p class="hint">
    先勾选条目，再点击中间按钮移动；也可以直接拖到另一侧。两侧搜索和勾选状态分别维护。
  </p>
</template>
