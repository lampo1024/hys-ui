<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysButton,
  HysForm,
  HysFormItem,
  HysInput,
  HysNumberInput,
  type HysFormRules,
} from "hys-ui";
const model = reactive({ age: "", quantity: 1 }),
  message = ref("年龄允许 18–120 的整数，数量允许 1–50 的整数");
const rules: HysFormRules = {
  age: {
    type: "integer",
    required: true,
    min: 18,
    max: 120,
    transform: (value) => (value === "" ? undefined : Number(value)),
    message: "请输入 18–120 的整数",
  },
  quantity: {
    type: "integer",
    required: true,
    min: 1,
    max: 50,
    message: "数量必须是 1–50 的整数",
  },
};
</script>
<template>
  <div class="demo-content">
    <HysForm
      :model="model"
      :rules="rules"
      label-position="left"
      label-width="auto"
      feedback-icon
      @submit="message = '数字校验通过'"
      @invalid="message = '请修正数字后重试'"
    >
      <HysFormItem
        label="年龄"
        prop="age"
        hint="文本通过 transform 转成数字校验，原始 model 保持文本"
        ><HysInput
          v-model="model.age"
          inputmode="numeric"
          placeholder="例如 28"
      /></HysFormItem>
      <HysFormItem label="数量" prop="quantity"
        ><HysNumberInput v-model="model.quantity" :min="1" :max="50"
      /></HysFormItem>
      <template #actions
        ><HysButton type="submit">检查数字</HysButton
        ><HysButton variant="secondary" type="reset">重置</HysButton></template
      >
    </HysForm>
    <output class="state-output" aria-live="polite">{{ message }}</output>
  </div>
</template>
