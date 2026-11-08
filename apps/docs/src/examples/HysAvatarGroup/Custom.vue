<script setup lang="ts">
import {
  HysAvatar,
  HysAvatarGroup,
  HysBadge,
  type HysAvatarOption,
} from "hys-ui";
import { UserRound, MoreHorizontal } from "lucide-vue-next";
const members: HysAvatarOption[] = [
  { name: "Alex" },
  { name: "Lisa" },
  { name: "Amy" },
  { name: "David" },
  { name: "王工" },
];
</script>
<template>
  <div class="demo-content">
    <HysAvatarGroup :size="44" shape="square" aria-label="插槽头像组"
      ><HysAvatar name="插槽文字">HYS</HysAvatar
      ><HysAvatar
        name="单独覆盖尺寸"
        :size="32"
        shape="circle"
        color="#d8f2e5"
        text-color="#258963"
        >王</HysAvatar
      ><HysBadge dot
        ><HysAvatar
          name="在线成员"
          :icon="UserRound" /></HysBadge></HysAvatarGroup
    ><HysAvatarGroup
      :options="members"
      :max-count="2"
      :max-style="{ background: '#fff0df', color: '#c7650c' }"
      :size="44"
      aria-label="自定义折叠头像组"
      ><template #avatar="{ option }"
        ><HysAvatar
          v-bind="option"
          color="#e9e4ff"
          text-color="#7951c7" /></template
      ><template #overflow="{ count }"
        ><span class="rest"
          ><MoreHorizontal :size="13" />{{ count }}</span
        ></template
      ></HysAvatarGroup
    >
    <p class="scenario-note">
      默认插槽可组合头像和徽标。avatar、overflow 插槽和 maxStyle
      可以定制成员与折叠入口。
    </p>
  </div>
</template>
<style scoped>
.rest {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
</style>
