<script setup lang="ts">
import { HysAvatar, type HysAvatarFit } from "hys-ui";
const fits: HysAvatarFit[] = ["fill", "contain", "cover", "none", "scale-down"];
const picture =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="140" height="60"><rect width="140" height="60" fill="#d9e9ff"/><circle cx="70" cy="30" r="24" fill="#5e8bd5"/><path d="M0 60L42 18l30 42 24-31 44 31" fill="#2c598e"/></svg>',
  );
</script>
<template>
  <div class="demo-content">
    <div class="fit-grid">
      <div v-for="fit in fits" :key="fit">
        <HysAvatar
          :src="picture"
          :fit="fit"
          shape="square"
          :size="80"
          :name="fit + ' 图片适配'"
        /><code>{{ fit }}</code>
      </div>
    </div>
    <p class="scenario-note">
      fit 支持全部图片适配模式；contain 保留完整图片，cover
      填满并裁切，scale-down 按需缩小。
    </p>
  </div>
</template>
<style scoped>
.fit-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
}
.fit-grid > div {
  display: grid;
  justify-items: center;
  gap: 12px;
}
.fit-grid code {
  font-size: 12px;
  color: var(--docs-muted);
}
</style>
