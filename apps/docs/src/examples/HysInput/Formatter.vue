<script setup lang="ts">
import { ref } from "vue";
import { HysInput } from "hys-ui";
const amount = ref("12345"),
  phone = ref("13800138000");
const money = (value: string) =>
  value ? "¥ " + value.replace(/\B(?=(\d{3})+(?!\d))/g, ",") : "";
const digits = (value: string) => value.replace(/\D/g, "");
const phoneFormat = (value: string) =>
  value.replace(/^(\d{3})(\d{0,4})(\d{0,4}).*$/, (_, a, b, c) =>
    [a, b, c].filter(Boolean).join(" "),
  );
</script>
<template>
  <div class="demo-content">
    <div class="input-demo-grid">
      <label class="input-demo-field"
        ><span>千位分隔显示</span
        ><HysInput
          v-model="amount"
          :formatter="money"
          :parser="digits"
          clearable
          name="amount"
          aria-label="格式化金额" /></label
      ><label class="input-demo-field"
        ><span>分组显示手机号</span
        ><HysInput
          v-model="phone"
          :formatter="phoneFormat"
          :parser="digits"
          :maxlength="11"
          inputmode="tel"
          aria-label="格式化手机号"
      /></label>
    </div>
    <output class="state-output"
      >原始金额：{{ amount }}<br />原始手机号：{{ phone }}</output
    >
    <p class="scenario-note">
      模型与原生表单提交保留解析后的值，格式化只影响显示。长度限制同样作用于原始值；输入中的光标会随显示内容调整。
    </p>
  </div>
</template>
