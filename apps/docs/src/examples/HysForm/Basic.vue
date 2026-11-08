<script setup lang="ts">
import {reactive,ref} from 'vue'
import {HysForm,HysFormItem,HysInput,HysButton,type HysFormRules} from 'hys-ui'
const model=reactive({name:'',email:''}),message=ref('填写资料后提交')
const rules:HysFormRules={name:{required:true,whitespace:true,message:'请输入姓名'},email:[{required:true,message:'请输入邮箱'},{type:'email',message:'请输入有效邮箱'}]}
</script>
<template><div class="demo-content"><HysForm :model="model" :rules="rules" @submit="message='提交成功'" @invalid="message='请先修正错误'"><HysFormItem label="姓名" prop="name"><HysInput v-model="model.name" placeholder="请输入姓名"/></HysFormItem><HysFormItem label="邮箱" prop="email"><HysInput v-model="model.email" placeholder="name@example.com"/></HysFormItem><template #actions="{validating}"><HysButton type="submit" :loading="validating">提交资料</HysButton><HysButton type="reset" variant="secondary">重置</HysButton></template></HysForm><output class="state-output" aria-live="polite">{{message}}</output></div></template>