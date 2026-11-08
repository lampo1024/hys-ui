<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysForm,
  HysFormItem,
  HysAutocomplete,
  HysButton,
  HysSelect,
  HysCheckbox,
} from "hys-ui";
const model = reactive({ city: "" }),
  form = ref<InstanceType<typeof HysForm>>(),
  size = ref<"sm" | "md" | "lg">("md"),
  disabled = ref(false),
  message = ref("");
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <label class="autocomplete-demo-field"
        ><span>表单控件尺寸</span
        ><HysSelect
          v-model="size"
          :options="
            ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
          " /></label
      ><HysCheckbox v-model="disabled" label="禁用表单" />
    </div>
    <HysForm
      ref="form"
      :model="model"
      :size="size"
      :disabled="disabled"
      :rules="{ city: [{ required: true, message: '请输入城市' }] }"
      @submit="message = '已提交：' + model.city"
      ><HysFormItem prop="city" label="城市"
        ><HysAutocomplete
          v-model="model.city"
          :options="['北京', '上海', '深圳', '杭州', '成都']"
          placeholder="选择城市，也可输入其他城市"
          clearable
          name="city"
      /></HysFormItem>
      <div class="demo-row">
        <HysButton type="submit">提交</HysButton
        ><HysButton
          variant="secondary"
          @click="
            form?.resetFields();
            message = '';
          "
          >重置表单</HysButton
        >
      </div></HysForm
    ><output>{{ message || "尺寸、禁用、标签与校验反馈从表单继承" }}</output>
  </div>
</template>
