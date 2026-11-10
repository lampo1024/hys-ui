<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysColorPicker,
  HysForm,
  HysFormItem,
  HysButton,
  HysSelect,
  HysCheckbox,
} from "hys-ui";
const model = reactive({ color: "" }),
  size = ref<"sm" | "md" | "lg">("md"),
  disabled = ref(false),
  result = ref("请选择颜色");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="demo-field"
        >颜色表单尺寸<HysSelect
          v-model="size"
          :options="
            ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
          " /></label
      ><HysCheckbox v-model="disabled" label="禁用颜色表单" />
    </div>
    <HysForm
      :model="model"
      :size="size"
      :disabled="disabled"
      @submit="result = '已保存 ' + model.color"
      @invalid="result = '请先选择颜色'"
      ><HysFormItem
        label="强调色"
        prop="color"
        :rules="{ required: true, message: '请选择颜色' }"
        ><HysColorPicker
          v-model="model.color"
          clearable
          name="color" /></HysFormItem
      ><template #actions
        ><HysButton native-type="submit">保存颜色</HysButton
        ><HysButton native-type="reset" variant="secondary"
          >重置颜色表单</HysButton
        ></template
      ></HysForm
    ><output class="state-output">{{ result }}</output>
  </div>
</template>
