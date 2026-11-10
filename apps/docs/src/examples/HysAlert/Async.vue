<script setup lang="ts">
import { ref } from "vue";
import {
  HysAlert,
  HysButton,
  HysCheckbox,
  type HysAlertInstance,
  type HysAlertCloseContext,
} from "hys-ui";
const api = ref<HysAlertInstance>(),
  allow = ref(false),
  fail = ref(false),
  title = ref("关闭前进行条件检查"),
  result = ref("等待操作");
function check(context: HysAlertCloseContext) {
  result.value = "正在检查";
  return new Promise<boolean>((resolve, reject) => {
    const timer = setTimeout(() => {
      if (fail.value) reject(new Error("检查失败，请重试"));
      else {
        result.value = allow.value ? "检查通过" : "当前条件不允许关闭";
        resolve(allow.value);
      }
    }, 650);
    context.signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        result.value = "已取消旧检查";
        resolve(false);
      },
      { once: true },
    );
  });
}
function replace() {
  title.value = title.value === "新的提示" ? "另一条提示" : "新的提示";
  void api.value?.show();
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="allow" label="允许关闭" /><HysCheckbox
        v-model="fail"
        label="模拟检查失败"
      /><HysButton @click="api?.show()">显示提示</HysButton
      ><HysButton @click="replace">更新提示</HysButton>
    </div>
    <HysAlert
      ref="api"
      :title="title"
      description="检查过程中不能重复提交。更新标题、重新显示或离开缓存页面会取消旧检查。"
      :before-close="check"
      @close-error="(error) => (result = error.message)"
      closable
      show-icon
    /><output class="state-output">{{ result }}</output>
  </div>
</template>
