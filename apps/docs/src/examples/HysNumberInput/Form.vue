<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysButton,
  HysForm,
  HysFormItem,
  HysNumberInput,
  HysSelect,
} from "hys-ui";
const model = reactive<{ quantity: number | null }>({ quantity: null }),
  size = ref<"sm" | "md" | "lg">("md"),
  message = ref("输入数量后提交");
</script>
<template>
  <div class="demo-content">
    <label class="demo-field"
      ><span>表单尺寸</span
      ><HysSelect
        v-model="size"
        :options="['sm', 'md', 'lg'].map((value) => ({ label: value, value }))"
        aria-label="数字表单尺寸" /></label
    ><HysForm
      :model="model"
      :size="size"
      :rules="{
        quantity: {
          required: true,
          type: 'integer',
          min: 1,
          max: 100,
          message: '请输入 1–100 的整数数量',
        },
      }"
      label-position="left"
      label-width="auto"
      @submit="message = '提交数量：' + model.quantity"
      @invalid="message = '请检查数量'"
      ><HysFormItem
        label="数量"
        prop="quantity"
        hint="支持表单错误、说明及标签自动关联"
        ><HysNumberInput
          v-model="model.quantity"
          :min="1"
          :max="100"
          clearable /></HysFormItem
      ><template #actions
        ><HysButton type="submit">提交数量</HysButton
        ><HysButton variant="secondary" type="reset"
          >重置数量</HysButton
        ></template
      ></HysForm
    ><output class="state-output" aria-live="polite">{{ message }}</output>
  </div>
</template>
