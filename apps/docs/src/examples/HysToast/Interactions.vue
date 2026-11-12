<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysToast,
  type HysToastAction,
  type HysToastCloseContext,
} from "hys-ui";

const open = ref(false),
  locked = ref(false),
  paused = ref(false),
  clickClose = ref(false),
  allowInteraction = ref(true),
  result = ref("");
const actions: HysToastAction[] = [
  {
    id: "detail",
    label: "查看详情",
    closeOnSuccess: false,
    run: () => {
      result.value = "工单 HY-204 正在审核。";
    },
  },
  {
    id: "finish",
    label: "标为已读",
    run: () => {
      result.value = "工单 HY-204 已标为已读。";
    },
  },
];
async function beforeClose({ reason }: HysToastCloseContext) {
  await Promise.resolve();
  if (locked.value) result.value = "关闭条件尚未满足 · " + reason;
  return !locked.value;
}
</script>

<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <HysCheckbox v-model="locked" label="阻止关闭" />
      <HysCheckbox v-model="paused" label="手动暂停计时" />
      <HysCheckbox v-model="clickClose" label="点消息关闭" />
      <HysCheckbox v-model="allowInteraction" label="允许交互" />
    </div>
    <div class="demo-control-actions">
      <HysButton
        @click="
          open = true;
          result = '';
        "
        >显示可操作提示</HysButton
      >
    </div>
    <HysToast
      v-model:open="open"
      title="工单状态更新"
      message="工单 HY-204 已进入审核。"
      type="info"
      :duration="7000"
      :paused="paused"
      :close-on-click="clickClose"
      :interactive="allowInteraction"
      :before-close="beforeClose"
      :actions="actions"
      action-layout="footer"
      close-on-escape
      keyboard-dismiss
      show-progress
      countdown
      copyable
      swipe
      @after-close="result = '关闭完成 · ' + $event.reason"
    />
    <output class="state-output">{{
      result ||
      "可横向滑动、按 Esc 关闭，或聚焦消息后按 Delete。悬停、切换标签页和切换窗口时暂停倒计时。"
    }}</output>
  </div>
</template>
