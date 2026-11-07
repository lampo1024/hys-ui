<script setup lang="ts">
import { reactive, ref } from 'vue';
import { HysForm, HysFormItem, HysInput, HysButton, type HysFormRule } from 'hys-ui';
const form = ref<InstanceType<typeof HysForm>>();
const model = reactive({ name: '', email: '' });
const message = ref('');
const rules: Record<string, HysFormRule[]> = { name: [{ required: true, message: '请输入姓名', trigger: 'blur' }, { min: 2, max: 20, message: '长度为 2–20 个字符' }], email: [{ required: true, message: '请输入邮箱' }, { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/, message: '邮箱格式不正确' }, { validator: async (value) => { await new Promise(resolve => setTimeout(resolve, 250)); return value === 'used@example.com' ? '此邮箱已存在' : true; } }] };
</script>
<template><HysForm ref="form" :model="model" :rules="rules" label-position="left" @submit="message='校验成功'" @invalid="message='请修正字段错误'"><HysFormItem label="姓名" prop="name"><HysInput v-model="model.name"/></HysFormItem><HysFormItem label="邮箱" prop="email" hint="used@example.com 会触发异步校验失败"><HysInput v-model="model.email"/></HysFormItem><template #actions="{validating}"><HysButton type="submit" :loading="validating">校验并提交</HysButton><HysButton type="reset" variant="secondary">重置</HysButton><HysButton variant="ghost" @click="form?.clearValidate()">清除错误</HysButton></template></HysForm><output aria-live="polite">{{message}}</output></template>
