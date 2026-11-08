<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import {
  HysSwitch,
  HysCheckbox,
  HysButton,
  type HysSwitchGuardContext,
} from "hys-ui";
const value = ref(false),
  fail = ref(false),
  message = ref(""),
  requests = ref(0);
function beforeChange(
  next: boolean,
  _current: boolean,
  { signal }: HysSwitchGuardContext,
) {
  requests.value++;
  message.value = "保存中…";
  return new Promise<boolean>((resolve, reject) => {
    const abort = () => {
        clearTimeout(timer);
        message.value = "本次保存已取消";
        resolve(false);
      },
      timer = setTimeout(() => {
        signal.removeEventListener("abort", abort);
        if (fail.value) reject(new Error("网络暂不可用"));
        else {
          message.value = "保存成功";
          resolve(true);
        }
      }, 800);
    signal.addEventListener("abort", abort, { once: true });
  });
}
</script>
<template>
  <div class="demo-content">
    <HysCheckbox v-model="fail" label="模拟保存失败" /><HysSwitch
      v-model="value"
      :before-change="beforeChange"
      active-text="通知已开启"
      inactive-text="通知已关闭"
      aria-label="异步通知"
      @error="(error) => (message = String(error))"
    /><output
      >{{ message || "切换时模拟异步保存" }} · 请求 {{ requests }} 次 · 当前
      {{ value }}</output
    >
    <p class="scenario-note">
      等待期间阻止重复切换。失败后状态保持原值；离开页面会取消当前保存，不会让过期结果覆盖新状态。
    </p>
  </div>
</template>
