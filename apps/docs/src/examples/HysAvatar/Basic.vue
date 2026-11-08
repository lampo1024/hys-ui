<script setup lang="ts">
import { HysAvatar } from "hys-ui";
const sizes = [24, 36, 48, 64];
</script>
<template>
  <div class="demo-content">
    <div
      v-for="shape in ['circle', 'square'] as const"
      :key="shape"
      class="avatar-basic-row"
    >
      <span>{{ shape === "circle" ? "圆形" : "方形" }}</span>
      <div class="demo-row">
        <HysAvatar
          v-for="size in sizes"
          :key="size"
          :size="size"
          :shape="shape"
          :alt="shape + ' ' + size + ' 像素头像'"
        />
      </div>
    </div>
    <p class="scenario-note">
      支持数字尺寸，以及 sm / md / lg。默认大小为 36px。
    </p>
  </div>
</template>
<style scoped>
.avatar-basic-row {
  display: grid;
  gap: 12px;
}
.avatar-basic-row > span {
  font-size: 12px;
  color: var(--docs-muted);
}
.avatar-basic-row .demo-row {
  gap: 22px;
  min-height: 80px;
}
</style>
