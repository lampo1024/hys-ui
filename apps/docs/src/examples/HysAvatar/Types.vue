<script setup lang="ts">
import { HysAvatar } from "hys-ui";
import { UserRound, Heart, Settings } from "lucide-vue-next";
const picture =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 80 80"><rect width="80" height="80" fill="#d7e7ff"/><circle cx="40" cy="29" r="14" fill="#5488d7"/><path d="M12 80a28 28 0 0 1 56 0" fill="#5488d7"/></svg>',
  );
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysAvatar :src="picture" name="图片头像" :size="48" /><HysAvatar
        :icon="UserRound"
        name="用户图标"
        :size="48"
      /><HysAvatar name="单字头像" :size="48">U</HysAvatar
      ><HysAvatar name="文字头像" :size="48">USER</HysAvatar
      ><HysAvatar
        name="自定义颜色"
        color="#fff0df"
        text-color="#c7650c"
        :size="48"
        >叶</HysAvatar
      ><HysAvatar
        name="插槽图标"
        color="#e9e4ff"
        text-color="#7951c7"
        :size="48"
        ><template #icon><Heart /></template></HysAvatar
      ><HysAvatar :icon="Settings" name="方形图标" shape="square" :size="48" />
    </div>
    <p class="scenario-note">
      支持图片、图标组件、图标插槽和文字。color 设置背景，textColor
      设置文字或图标颜色。
    </p>
  </div>
</template>
