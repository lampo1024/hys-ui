<script setup lang="ts">
import { ref } from "vue";
import { HysTextarea } from "hys-ui";
const value = ref("你好 👋🏽\n欢迎使用 HYS UI");
</script>
<template>
  <div class="demo-content">
    <HysTextarea
      v-model="value"
      label="可见字符限制"
      count-graphemes
      :maxlength="40"
      show-count
      count-position="outside"
      clearable
      :autosize="{ minRows: 3, maxRows: 6 }"
    /><output class="state-output">{{ value }}</output>
    <p class="scenario-note">
      组合表情按一个可见字符计数；换行仍计入长度。输入时不会把一个组合表情裁成半个字符。
    </p>
  </div>
</template>
