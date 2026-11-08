<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import {
  HysCheckbox,
  HysForm,
  HysFormItem,
  HysButton,
  HysSelect,
} from "hys-ui";
const data = reactive({ selection: false }),
  form = ref<InstanceType<typeof HysForm>>(),
  size = ref<"sm" | "md" | "lg">("md"),
  message = ref("");
</script>
<template>
  <div class="demo-content">
    <label class="choice-demo-field"
      ><span>表单尺寸</span
      ><HysSelect
        v-model="size"
        :options="
          ['sm', 'md', 'lg'].map((value) => ({ label: value, value }))
        " /></label
    ><HysForm
      ref="form"
      :model="data"
      :size="size"
      :rules="{
        selection: {
          validator: (value: unknown) => value === true || '请确认此项',
        },
      }"
      @submit="message = '提交成功'"
      ><HysFormItem label="使用条款" prop="selection"
        ><HysCheckbox v-model="data.selection" label="同意使用条款"
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
    ><output>{{ message || JSON.stringify(data.selection) }}</output>
  </div>
</template>
