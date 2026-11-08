<script setup lang="ts">
import { ref } from "vue";
import { HysAvatar, HysBadge, HysButton } from "hys-ui";
const count = ref(12);
</script>
<template>
  <div class="demo-content">
    <div class="badge-avatars">
      <HysBadge :value="count"
        ><HysAvatar name="消息数量" :size="48" /></HysBadge
      ><HysBadge dot
        ><HysAvatar name="新消息" shape="square" :size="48" /></HysBadge
      ><HysBadge :value="count" :max="9"
        ><HysAvatar name="超出计数" :size="48">周</HysAvatar></HysBadge
      >
    </div>
    <div class="demo-row">
      <HysButton size="sm" variant="secondary" @click="count++"
        >增加消息</HysButton
      ><HysButton size="sm" variant="secondary" @click="count = 0"
        >清空消息</HysButton
      >
    </div>
  </div>
</template>
<style scoped>
.badge-avatars {
  display: flex;
  gap: 32px;
  flex-wrap: wrap;
  padding: 12px 10px;
}
</style>
