<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysButton,
  HysForm,
  HysFormItem,
  HysInputOtp,
  type HysFormRules,
} from "hys-ui";
const model = reactive({ code: "" });
const feedback = ref("");
const rules: HysFormRules = {
  code: [
    { required: true, message: "请输入配对码" },
    { pattern: /^[0-9]{6}$/, message: "请输入完整的 6 位数字" },
  ],
};
</script>

<template>
  <div class="demo-stack">
    <HysForm
      :model="model"
      :rules="rules"
      @submit="feedback = '已收到设备配对请求'"
      @invalid="feedback = '请检查配对码'"
      @reset="feedback = ''"
    >
      <HysFormItem label="设备配对码" prop="code">
        <HysInputOtp
          v-model="model.code"
          name="pairingCode"
          aria-label="设备配对码"
        />
      </HysFormItem>
      <template #actions="{ validating }">
        <HysButton type="submit" :loading="validating">请求配对</HysButton>
        <HysButton type="reset" variant="secondary">重置</HysButton>
      </template>
    </HysForm>
    <span role="status">{{ feedback }}</span>
  </div>
</template>
