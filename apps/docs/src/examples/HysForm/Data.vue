<script setup lang="ts">
import { reactive, ref } from "vue";
import { HysButton, HysForm, HysFormItem, HysInput } from "hys-ui";
const form = ref<InstanceType<typeof HysForm>>(),
  model = reactive({ profile: { name: "", email: "" } }),
  message = ref("可回填记录、设置服务端错误或更新重置基线");
function load() {
  form.value?.setFieldsValue({
    profile: { name: "示例用户", email: "member@example.com" },
  });
  form.value?.captureInitialValues();
  form.value?.clearValidate();
  message.value = "已回填，并把记录设为重置基线";
}
function serverError() {
  form.value?.setFields([
    {
      name: ["profile", "email"],
      errors: ["该邮箱已被使用", "请使用其他邮箱"],
    },
  ]);
  message.value = "已回填两条服务端错误";
}
function read() {
  message.value = JSON.stringify(form.value?.getFieldsValue());
}
</script>
<template>
  <div class="demo-content">
    <HysForm ref="form" :model="model" feedback-icon>
      <HysFormItem label="姓名" :prop="['profile', 'name']"
        ><HysInput v-model="model.profile.name"
      /></HysFormItem>
      <HysFormItem label="邮箱" :prop="['profile', 'email']"
        ><HysInput v-model="model.profile.email"
      /></HysFormItem>
    </HysForm>
    <div class="demo-row">
      <HysButton @click="load">回填记录</HysButton
      ><HysButton variant="secondary" @click="serverError"
        >模拟服务端错误</HysButton
      ><HysButton
        variant="secondary"
        @click="form?.setFieldValue(['profile', 'name'], '更新后的姓名')"
        >局部赋值</HysButton
      ><HysButton variant="secondary" @click="form?.resetFields()"
        >恢复记录</HysButton
      ><HysButton variant="ghost" @click="form?.clearValidate()"
        >清除反馈</HysButton
      ><HysButton variant="ghost" @click="read">读取快照</HysButton>
    </div>
    <output class="state-output" aria-live="polite">{{ message }}</output>
    <p class="scenario-note">
      读操作返回独立快照。setFieldsValue
      深度合并对象、替换数组，不自动校验；setFields
      可同时设置值、错误与警告。setInitialValues 只更新重置基线，不改当前值。
    </p>
  </div>
</template>
