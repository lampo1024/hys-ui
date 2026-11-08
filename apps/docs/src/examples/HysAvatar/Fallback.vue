<script setup lang="ts">
import { ref } from "vue";
import { HysAvatar, HysButton } from "hys-ui";
import { UserRound, ImageOff } from "lucide-vue-next";
const good =
  "data:image/svg+xml," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" rx="18" fill="#d8f2e5"/><circle cx="40" cy="29" r="14" fill="#258963"/><path d="M12 80a28 28 0 0 1 56 0" fill="#258963"/></svg>',
  );
const broken = "data:image/png;base64,broken",
  src = ref(broken),
  errors = ref(0);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysAvatar
        :src="src"
        :size="56"
        name="可恢复图片"
        @error="errors++"
      /><HysAvatar
        :src="broken"
        :fallback-src="good"
        :size="56"
        name="备用图片"
      /><HysAvatar :src="broken" :size="56" name="自定义回退"
        ><template #fallback><ImageOff :size="24" /></template></HysAvatar
      ><HysAvatar :src="broken" :icon="UserRound" :size="56" name="回退图标" />
    </div>
    <div class="demo-row">
      <HysButton variant="secondary" size="sm" @click="src = good"
        >恢复有效图片</HysButton
      ><HysButton variant="secondary" size="sm" @click="src = broken"
        >模拟图片失败</HysButton
      >
    </div>
    <output class="state-output"
      >第一个头像发生 {{ errors }} 次加载错误。</output
    >
    <p class="scenario-note">
      图片失败后可尝试 fallbackSrc，继续失败时展示 fallback
      插槽、图标或文字。更换来源会自动重试；loadError 返回 false
      可保留原图节点并自行处理。
    </p>
  </div>
</template>
