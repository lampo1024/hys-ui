<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysInputOtp } from "hys-ui";
const code = ref("");
const message = ref("");
function verify(value: string) {
  message.value = value === "804216" ? "验证通过" : "验证码不匹配";
}
</script>

<template>
  <div class="demo-stack">
    <p class="scenario-note">输入或粘贴示例验证码 804216。</p>
    <div>
      <HysInputOtp
        v-model="code"
        :error="message === '验证码不匹配'"
        @update:model-value="message = ''"
        @complete="verify"
      />
    </div>
    <div class="demo-row">
      <HysButton
        variant="secondary"
        size="sm"
        @click="
          code = '';
          message = '';
        "
        >清空</HysButton
      >
      <span role="status">{{ message }}</span>
    </div>
  </div>
</template>
