<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysInputOtp } from "hys-ui";
const masked = ref(true);
const value = ref("");
const complete = ref(false);
</script>
<template>
  <div class="demo-stack">
    <HysCheckbox v-model="masked">隐藏交易验证码</HysCheckbox>
    <HysInputOtp
      v-model="value"
      :masked="masked"
      :groups="[3, 3]"
      aria-label="交易验证码"
      @change="complete = false"
      @complete="complete = true"
    />
    <span role="status">{{
      complete ? "已录入完整验证码" : "已输入 " + value.length + " / 6 位"
    }}</span>
  </div>
</template>
