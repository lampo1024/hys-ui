<script setup lang="ts">
import { ref } from "vue";
import { HysTagInput, type HysTagInputInvalid } from "hys-ui";
const tags = ref(["Vue"]),
  message = ref("最多 3 个标签，不区分大小写");
function invalid(info: HysTagInputInvalid) {
  message.value =
    info.value +
    "：" +
    {
      max: "数量已满",
      duplicate: "重复标签",
      guard: "校验未通过",
      error: "检查失败",
      maxlength: "文字过长",
      minlength: "文字过短",
    }[info.reason];
}
</script>
<template>
  <div class="demo-stack">
    <HysTagInput
      v-model="tags"
      :max="3"
      :case-sensitive="false"
      :before-add="(value) => !value.includes('!')"
      clearable
      @invalid="invalid"
      aria-label="受限标签"
    /><output class="state-output" aria-live="polite">{{ message }}</output>
    <p class="scenario-note">
      输入 vue 会判为重复，带 !
      的标签不会通过检查。被拒绝的草稿会保留，方便修改。
    </p>
  </div>
</template>
