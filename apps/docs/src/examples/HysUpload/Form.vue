<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysUpload,
  HysForm,
  HysFormItem,
  HysSelect,
  HysCheckbox,
  HysButton,
  type HysUploadFile,
} from "hys-ui";
const model = reactive({ attachments: [] as HysUploadFile[] }),
  form = ref<InstanceType<typeof HysForm>>(),
  size = ref<"sm" | "md" | "lg">("sm"),
  disabled = ref(false),
  result = ref("");
</script>
<template>
  <div class="demo-stack">
    <div class="demo-control-actions">
      <HysSelect
        v-model="size"
        aria-label="表单控件尺寸"
        :options="['sm', 'md', 'lg'].map((value) => ({ label: value, value }))"
        style="width: 140px"
      /><HysCheckbox v-model="disabled" label="禁用表单" />
    </div>
    <HysForm
      ref="form"
      :model="model"
      :size="size"
      :disabled="disabled"
      :rules="{
        attachments: [
          {
            type: 'array',
            required: true,
            min: 1,
            message: '请至少添加一个附件',
          },
        ],
      }"
      @submit="result = '附件检查通过'"
      @invalid="result = '请添加必要附件'"
      ><HysFormItem
        prop="attachments"
        label="申请附件"
        hint="附件类型为 PDF 或图片"
        ><HysUpload
          v-model="model.attachments"
          accept=".pdf,image/*"
          :limit="3"
      /></HysFormItem>
      <div class="demo-control-actions">
        <HysButton native-type="submit">检查并提交</HysButton
        ><HysButton
          native-type="button"
          variant="ghost"
          @click="
            form?.resetFields();
            result = '';
          "
          >重置表单</HysButton
        >
      </div></HysForm
    ><output class="state-output">{{ result || "等待提交" }}</output>
  </div>
</template>
