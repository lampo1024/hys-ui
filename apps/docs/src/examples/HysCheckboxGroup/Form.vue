<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import {
  HysCheckboxGroup,
  HysForm,
  HysFormItem,
  HysButton,
  HysSelect,
} from "hys-ui";
const data = reactive({ selection: [] as string[] }),
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
          type: 'array',
          min: 1,
          required: true,
          message: '请至少选择一项',
        },
      }"
      @submit="message = '提交成功'"
      ><HysFormItem label="选择角色" prop="selection"
        ><HysCheckboxGroup
          v-model="data.selection"
          :options="[
            { label: '设计', value: 'design' },
            { label: '研发', value: 'dev' },
          ]"
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
