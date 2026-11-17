<script setup lang="ts">
import { ref } from "vue";
import { HysCheckbox, HysCopyButton } from "hys-ui";
const disabled = ref(false);
const denyWrite = async () => {
  throw new DOMException("剪贴板写入被拒绝", "NotAllowedError");
};
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="disabled">禁用复制按钮</HysCheckbox>
    <div class="demo-row">
      <HysCopyButton
        text="ORD-20261116-042"
        label="复制订单号"
        :disabled="disabled"
      />
      <HysCopyButton
        text="ORD-20261116-042"
        label="模拟拒绝"
        :disabled="disabled"
        :write-text="denyWrite"
        error-text="剪贴板权限被拒绝"
      />
    </div>
  </div>
</template>
