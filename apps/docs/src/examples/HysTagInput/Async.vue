<script setup lang="ts">
import { ref } from "vue";
import {
  HysTagInput,
  HysCheckbox,
  HysButton,
  type HysTagInputInstance,
  type HysTagInputAddContext,
} from "hys-ui";
const tags = ref(["已确认"]),
  allow = ref(true),
  api = ref<HysTagInputInstance>(),
  message = ref("等待添加");
function check(value: string, c: HysTagInputAddContext) {
  message.value = "正在检查 " + value;
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      message.value = allow.value ? "检查通过" : "条件不满足";
      resolve(allow.value);
    }, 700);
    c.signal.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        message.value = "已取消旧检查";
        resolve(false);
      },
      { once: true },
    );
  });
}
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysCheckbox v-model="allow" label="允许添加" /><HysButton
        @click="tags = ['外部更新']"
        >替换外部数据</HysButton
      ><HysButton variant="ghost" @click="api?.setDraft('新的草稿')"
        >更新草稿</HysButton
      >
    </div>
    <HysTagInput
      ref="api"
      v-model="tags"
      :before-add="check"
      clearable
      aria-label="异步标签"
    /><output class="state-output">{{ message }} · {{ tags }}</output>
    <p class="scenario-note">
      检查期间避免重复提交；按
      Esc、替换模型或离开页面会取消旧检查。新输入的草稿不会被旧结果清空。
    </p>
  </div>
</template>
