<script setup lang="ts">
import { HysAvatar, HysAvatarGroup, type HysAvatarOption } from "hys-ui";
const members: HysAvatarOption[] = [
  { key: 1, name: "张明" },
  { key: 2, name: "Lisa", color: "#e9e4ff", textColor: "#7951c7" },
  { key: 3, name: "陈工", color: "#fff0df", textColor: "#c7650c" },
  { key: 4, name: "David", color: "#d8f2e5", textColor: "#258963" },
  { key: 5, name: "王工" },
];
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysAvatarGroup
        :options="members"
        :size="44"
        :max-count="3"
        aria-label="项目成员"
      /><HysAvatarGroup shape="square" :size="40"
        ><HysAvatar name="叶" /><HysAvatar name="陈" /><HysAvatar name="王"
      /></HysAvatarGroup>
    </div>
    <p class="scenario-note">
      HysAvatarGroup
      支持数据和默认插槽。组内统一尺寸和形状，单个头像仍可显式覆盖；超出
      maxCount 的成员通过计数按钮查看。
    </p>
  </div>
</template>
