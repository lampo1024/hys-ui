<script setup lang="ts">
import { ref } from "vue";
import { HysButton, HysInputOtp } from "hys-ui";
const code = ref("");
const output = ref("");
const field = ref<InstanceType<typeof HysInputOtp>>();
function retry() {
  field.value?.select();
  output.value = "";
}
</script>
<template>
  <div class="demo-stack">
    <span>输入 8 位设备配对码。可试着粘贴 <code>ab24-xy62</code>。</span>
    <HysInputOtp
      ref="field"
      v-model="code"
      :length="8"
      :groups="[4, 4]"
      letter-case="upper"
      pattern="[A-Z0-9]"
      aria-label="设备配对码"
      @complete="output = $event === 'AB24XY62' ? '设备配对成功' : '配对码无效'"
    />
    <div class="demo-row">
      <HysButton size="sm" variant="secondary" @click="retry"
        >重新输入</HysButton
      >
      <HysButton
        size="sm"
        variant="ghost"
        @click="
          field?.clear();
          output = '';
        "
        >清空配对码</HysButton
      >
    </div>
    <span role="status">{{ output }}</span>
  </div>
</template>
