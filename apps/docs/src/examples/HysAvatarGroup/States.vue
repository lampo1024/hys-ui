<script setup lang="ts">
import { HysAvatarGroup } from "hys-ui";
const members = [{ name: "Alex" }, { name: "Lisa" }, { name: "Amy" }];
</script>
<template>
  <div class="demo-content">
    <HysAvatarGroup :options="[]" aria-label="空头像组"
      ><template #empty
        ><span class="empty-members">暂无成员</span></template
      ></HysAvatarGroup
    ><HysAvatarGroup
      :options="members"
      :max-count="0"
      aria-label="仅计数头像组"
    /><HysAvatarGroup
      :options="members"
      :max-count="2"
      :show-overflow="false"
      aria-label="隐藏折叠入口"
    />
    <p class="scenario-note">
      支持空内容、仅计数入口和隐藏折叠入口。隐藏成员在浮层展开前不会挂载图片。
    </p>
  </div>
</template>
<style scoped>
.empty-members {
  font-size: 13px;
  color: var(--docs-muted);
}
</style>
