<script setup lang="ts">
import { ref } from "vue";
import { HysAvatarGroup, HysNumberInput, type HysAvatarOption } from "hys-ui";
const count = ref(2),
  state = ref("尚未展开"),
  members: HysAvatarOption[] = [
    { name: "张明" },
    { name: "李工" },
    { name: "王工" },
    { name: "Lisa" },
    { name: "David" },
  ];
</script>
<template>
  <div class="demo-content">
    <label class="demo-field"
      ><span>显示的头像数量</span
      ><HysNumberInput
        v-model="count"
        :min="0"
        :max="5"
        aria-label="折叠头像数量" /></label
    ><HysAvatarGroup
      :options="members"
      :max-count="count"
      :size="48"
      trigger="click"
      aria-label="折叠团队"
      @visible-change="state = $event ? '展开其余成员' : '关闭其余成员'"
    /><output class="state-output" aria-live="polite">{{ state }}</output>
    <p class="scenario-note">
      +N 不计入 maxCount。点击计数按钮展开，Escape 关闭并恢复焦点；maxCount=0
      时只显示总数入口。
    </p>
  </div>
</template>
