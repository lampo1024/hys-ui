<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysCascader,
  HysForm,
  HysFormItem,
  HysButton,
  HysSelect,
  HysCheckbox,
} from "hys-ui";
const options = [
  {
    value: "rd",
    label: "研发中心",
    children: [
      { value: "backend", label: "后端研发" },
      { value: "frontend", label: "前端研发" },
      { value: "qa", label: "测试归档", disabled: true },
    ],
  },
  {
    value: "product",
    label: "产品中心",
    children: [
      { value: "design", label: "交互设计" },
      { value: "research", label: "用户研究" },
    ],
  },
  { value: "business", label: "商务协作" },
];
const model = reactive({ category: [] as string[] }),
  size = ref<"sm" | "md" | "lg">("md"),
  disabled = ref(false),
  result = ref("");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-controls">
      <label class="demo-field"
        >表单尺寸<HysSelect
          v-model="size"
          :options="[
            { label: '小', value: 'sm' },
            { label: '中', value: 'md' },
            { label: '大', value: 'lg' },
          ]" /></label
      ><HysCheckbox v-model="disabled">禁用表单</HysCheckbox>
    </div>
    <HysForm
      :model="model"
      :size="size"
      :disabled="disabled"
      @submit="result = '分类配置已保存'"
      @invalid="result = '请先选择分类'"
      ><HysFormItem
        prop="category"
        label="交付分类"
        :rules="{
          type: 'array',
          required: true,
          min: 1,
          message: '请选择交付分类',
        }"
        ><HysCascader
          v-model="model.category"
          :options="options"
          clearable
          filterable
          name="category" /></HysFormItem
      ><template #actions
        ><HysButton native-type="submit">保存配置</HysButton
        ><HysButton native-type="reset" variant="secondary"
          >重置</HysButton
        ></template
      ></HysForm
    ><output>{{ result || model.category }}</output>
  </div>
</template>
