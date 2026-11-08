<script setup lang="ts">
import { ref } from "vue";
import { HysAvatarGroup, HysButton, type HysAvatarGroupInstance } from "hys-ui";
const group = ref<HysAvatarGroupInstance>(),
  members = [
    { name: "Alex" },
    { name: "Lisa" },
    { name: "David" },
    { name: "Amy" },
  ];
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysButton variant="secondary" size="sm" @click="group?.open()"
        >打开成员浮层</HysButton
      ><HysButton variant="secondary" size="sm" @click="group?.close()"
        >关闭成员浮层</HysButton
      >
    </div>
    <HysAvatarGroup
      ref="group"
      :options="members"
      :max-count="2"
      trigger="focus"
      placement="bottom-end"
      aria-label="聚焦展开头像组"
    />
    <p class="scenario-note">
      Tab 聚焦计数入口时展开。ArrowDown 打开并聚焦浮层，Escape
      关闭并恢复焦点；也可通过实例方法控制。
    </p>
  </div>
</template>
