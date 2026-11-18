<script setup lang="ts">
import { ref } from "vue";
import { HysInputOtp, HysButton } from "hys-ui";
const code = ref("");
const invalid = ref(false);
const editor = ref<InstanceType<typeof HysInputOtp>>();
function failVerification() {
  invalid.value = true;
  editor.value?.focus();
}
</script>

<template>
  <div class="demo-stack">
    <HysInputOtp ref="editor" v-model="code" mode="alphanumeric" letter-case="upper" :groups="[4, 2]" separator="–"
      :error="invalid" clear-on-error aria-label="设备配对码" @complete="invalid = false" />
    <div class="demo-row">
      <HysButton size="sm" variant="secondary" @click="invalid = false; code = 'D202AB'">填入示例验证码</HysButton>
      <HysButton size="sm" variant="secondary" :disabled="invalid || code.length < 6" @click="failVerification">模拟校验失败</HysButton>
    </div>
    <p v-if="invalid" role="status">配对码错误，请重新输入。</p>
  </div>
</template>
