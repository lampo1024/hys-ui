<script setup lang="ts">
import { ref } from "vue";
import {
  HysDrawer,
  HysButton,
  HysCheckbox,
  type HysDrawerActionContext,
} from "hys-ui";
const open = ref(false),
  fail = ref(true),
  result = ref("等待保存"),
  attempts = ref(0);
async function save({ signal }: HysDrawerActionContext) {
  attempts.value++;
  await new Promise<void>((resolve) => {
    const finish = () => {
        clearTimeout(timer);
        signal.removeEventListener("abort", finish);
        resolve();
      },
      timer = setTimeout(finish, 800);
    signal.addEventListener("abort", finish, { once: true });
  });
  if (signal.aborted) return false;
  if (fail.value) {
    fail.value = false;
    throw Error("模拟保存失败");
  }
  result.value = "保存成功";
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="fail" label="下一次模拟失败" /><HysButton
        @click="open = true"
        >异步保存与重试</HysButton
      >
    </div>
    <output class="state-output">{{ result }} · 已请求 {{ attempts }} 次</output
    ><HysDrawer
      v-model:open="open"
      title="保存资源"
      footer
      close-while-confirming
      :before-confirm="save"
      error-text="保存失败，请重试。"
      ok-text="保存资源"
      ><p>
        确认按钮自动进入加载状态，重复操作被阻止；失败时保留内容并显示错误。取消或页面离开会中止
        signal，示例同时清理等待中的计时器。
      </p></HysDrawer
    >
  </div>
</template>
