<script setup lang="ts">
import { reactive, ref } from "vue";
import {
  HysButton,
  HysCheckbox,
  HysDatePicker,
  HysForm,
  HysFormItem,
  HysInput,
  HysRadioGroup,
  HysSelect,
  HysSwitch,
  HysTextarea,
  type HysFormRules,
} from "hys-ui";
const model = reactive({
    name: "",
    role: "member",
    date: "",
    mode: "online",
    notify: true,
    note: "",
    accepted: false,
  }),
  message = ref("填写资料后提交");
const rules: HysFormRules = {
  name: { required: true, message: "请填写姓名" },
  date: { required: true, message: "请选择日期" },
  accepted: { validator: (value) => value === true || "请确认使用说明" },
};
</script>
<template>
  <div class="demo-content">
    <HysForm
      :model="model"
      :rules="rules"
      :columns="{ xs: 1, md: 2 }"
      feedback-icon
      @submit="message = '资料已提交（演示）'"
      @invalid="message = '请检查必填项'"
    >
      <HysFormItem label="姓名" prop="name"
        ><HysInput v-model="model.name"
      /></HysFormItem>
      <HysFormItem label="角色" prop="role"
        ><HysSelect
          v-model="model.role"
          :options="[
            { label: '普通成员', value: 'member' },
            { label: '管理员', value: 'admin' },
          ]"
      /></HysFormItem>
      <HysFormItem label="开始日期" prop="date"
        ><HysDatePicker v-model="model.date"
      /></HysFormItem>
      <HysFormItem label="参与方式" prop="mode"
        ><HysRadioGroup
          v-model="model.mode"
          :options="[
            { label: '线上', value: 'online' },
            { label: '线下', value: 'offline' },
          ]"
      /></HysFormItem>
      <HysFormItem label="接收通知" prop="notify"
        ><HysSwitch v-model="model.notify"
      /></HysFormItem>
      <HysFormItem label="补充说明" prop="note"
        ><HysTextarea v-model="model.note" :rows="2"
      /></HysFormItem>
      <HysFormItem prop="accepted" :span="{ xs: 1, md: 2 }"
        ><HysCheckbox v-model="model.accepted" label="我已阅读并确认使用说明"
      /></HysFormItem>
      <template #actions
        ><HysButton type="submit">提交完整资料</HysButton
        ><HysButton type="reset" variant="secondary"
          >重置资料</HysButton
        ></template
      >
    </HysForm>
    <output class="state-output" aria-live="polite">{{ message }}</output>
  </div>
</template>
