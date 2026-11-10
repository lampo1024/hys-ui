<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysTagInput,
  HysForm,
  HysFormItem,
  HysButton,
  HysSelect,
  HysCheckbox,
} from "hys-ui";
const model = reactive({ tags: [] as string[] }),
  size = ref<"sm" | "md" | "lg">("md"),
  disabled = ref(false),
  result = ref("请添加至少一个标签");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <label class="demo-field"
        >表单尺寸<HysSelect
          v-model="size"
          :options="
            ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
          " /></label
      ><HysCheckbox v-model="disabled" label="禁用标签表单" />
    </div>
    <HysForm
      :model="model"
      :size="size"
      :disabled="disabled"
      @submit="result = '已保存 ' + model.tags.join('、')"
      @invalid="result = '请检查标签'"
      ><HysFormItem
        label="关键词"
        prop="tags"
        :rules="{
          type: 'array',
          required: true,
          min: 1,
          message: '至少添加一个标签',
        }"
        ><HysTagInput v-model="model.tags" name="tags" clearable /></HysFormItem
      ><template #actions
        ><HysButton native-type="submit">保存标签</HysButton
        ><HysButton native-type="reset" variant="secondary"
          >重置标签表单</HysButton
        ></template
      ></HysForm
    ><output class="state-output">{{ result }}</output>
  </div>
</template>
