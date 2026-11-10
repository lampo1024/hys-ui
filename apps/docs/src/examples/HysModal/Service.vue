<script setup lang="ts">
import { ref } from "vue";
import {
  HysButton,
  HysSelect,
  useHysModal,
  type HysModalType,
  type HysModalHandle,
} from "hys-ui";
const dialogs = useHysModal(),
  type = ref<HysModalType>("confirm"),
  result = ref("等待操作");
let current: HysModalHandle | undefined;
async function show() {
  current = dialogs[type.value === "default" ? "confirm" : type.value]({
    title: "操作提示",
    content: "调用式弹窗继承当前页面的主题，返回可等待的操作结果。",
  });
  const answer = await current.closed;
  result.value = answer.action + " / " + answer.reason;
}
</script>
<template>
  <div class="demo-content">
    <HysSelect
      v-model="type"
      style="width: 200px"
      :options="[
        { label: '确认', value: 'confirm' },
        { label: '信息', value: 'info' },
        { label: '成功', value: 'success' },
        { label: '警告', value: 'warning' },
        { label: '错误', value: 'error' },
      ]"
    /><HysButton @click="show">调用弹窗</HysButton
    ><HysButton variant="secondary" @click="dialogs.destroyAll()"
      >清理全部</HysButton
    >
  </div>
  <p class="state-output">操作结果：{{ result }}</p>
</template>
