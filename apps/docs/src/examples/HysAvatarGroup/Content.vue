<script setup lang="ts">
import { ref } from "vue";
import {
  HysAvatar,
  HysAvatarGroup,
  HysButton,
  type HysAvatarOption,
} from "hys-ui";
const selected = ref("尚未选择成员"),
  members: HysAvatarOption[] = [
    { name: "张明" },
    { name: "Lisa" },
    { name: "David" },
    { name: "Amy" },
  ];
</script>
<template>
  <div class="demo-content">
    <HysAvatarGroup
      :options="members"
      :max-count="2"
      trigger="click"
      aria-label="自定义成员浮层"
      ><template #content="{ options, close }"
        ><div class="member-panel">
          <div
            v-for="(option, index) in options"
            :key="index"
            class="member-row"
          >
            <HysAvatar v-bind="option" :size="32" /><span>{{
              option.name
            }}</span
            ><HysButton
              variant="ghost"
              size="sm"
              :aria-label="'查看 ' + option.name"
              @click="
                selected = '已选择 ' + option.name;
                close();
              "
              >查看</HysButton
            >
          </div>
        </div></template
      ></HysAvatarGroup
    ><output class="state-output" aria-live="polite">{{ selected }}</output>
    <p class="scenario-note">
      content 插槽可添加成员说明和操作，完成操作后调用 close 关闭浮层。
    </p>
  </div>
</template>
<style scoped>
.member-panel {
  display: grid;
  gap: 14px;
  min-width: 220px;
}
.member-row {
  display: flex;
  gap: 12px;
  align-items: center;
}
.member-row > span {
  flex: 1;
  font-size: 13px;
}
</style>
