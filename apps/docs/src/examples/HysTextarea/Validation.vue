<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysForm,
  HysFormItem,
  HysInput,
  HysTextarea,
  type HysFormRules,
} from "hys-ui";

const model = reactive({ subject: "", note: "" });
const automatic = ref(false);
const rules: HysFormRules = {
  subject: [
    { required: true, message: "请输入主题", trigger: ["change", "blur"] },
  ],
  note: [
    {
      min: 8,
      required: true,
      message: "请填写至少 8 个字符",
      trigger: ["change", "blur"],
    },
  ],
};
</script>

<template>
  <div class="demo-stack">
    <HysCheckbox v-model="automatic" label="输入或失焦时自动校验" />
    <HysForm
      :model="model"
      :rules="rules"
      label-position="top"
      class="example-form"
    >
      <HysFormItem prop="subject" label="反馈主题">
        <HysInput v-model="model.subject" :validate-event="automatic" />
      </HysFormItem>
      <HysFormItem prop="note" label="详细说明">
        <HysTextarea
          v-model="model.note"
          :validate-event="automatic"
          :rows="2"
        />
      </HysFormItem>
      <template #actions>
        <HysButton size="sm" type="submit">校验表单</HysButton>
        <HysButton size="sm" type="reset" variant="secondary"
          >重置字段</HysButton
        >
      </template>
    </HysForm>
  </div>
</template>

<style scoped>
.example-form {
  width: min(100%, 36rem);
}
</style>
