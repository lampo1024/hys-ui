<script setup lang="ts">
import { HysAvatarGroup, type HysAvatarOption } from "hys-ui";
const members: HysAvatarOption[] = [
  { key: "alex", name: "Alex" },
  { key: "lisa", name: "Lisa", color: "#e9e4ff", textColor: "#7951c7" },
  { key: "amy", name: "Amy", color: "#d8f2e5", textColor: "#258963" },
  { key: "david", name: "David", color: "#fff0df", textColor: "#c7650c" },
];
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysAvatarGroup
        :options="members"
        :size="44"
        aria-label="圆形团队成员"
      /><HysAvatarGroup
        :options="members"
        :size="40"
        shape="square"
        aria-label="方形团队成员"
      />
    </div>
    <p class="scenario-note">
      组内统一管理尺寸、形状和描边。gap 为负数时重叠显示，正数时保留间距。
    </p>
  </div>
</template>
