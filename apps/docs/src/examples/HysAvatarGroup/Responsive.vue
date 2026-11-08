<script setup lang="ts">
import {
  HysAvatarGroup,
  type HysAvatarOption,
  type HysAvatarSize,
} from "hys-ui";
const members: HysAvatarOption[] = [
    { name: "Alex" },
    { name: "Lisa" },
    { name: "Amy" },
    { name: "David" },
  ],
  size: HysAvatarSize = { xs: 24, sm: 32, md: 40, lg: 48, xl: 64 };
</script>
<template>
  <div class="demo-content">
    <HysAvatarGroup
      :options="members"
      :size="size"
      :max-count="3"
      aria-label="响应式团队"
    />
    <p class="scenario-note">
      组内成员和计数入口一起调整尺寸，响应式头像共享窗口尺寸监听。
    </p>
  </div>
</template>
