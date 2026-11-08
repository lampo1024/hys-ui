<script setup lang="ts">
import {reactive,ref} from 'vue'
import {HysForm,HysFormItem,HysInput,HysButton,type HysFormRule} from 'hys-ui'
const model=reactive({password:'',confirm:''}),message=ref('')
const confirmRules:HysFormRule[]=[{required:true,message:'请再次输入密码'},{validator:(value,values)=>value===values.password||'两次密码不一致'}]
</script>
<template><div class="demo-content"><HysForm :model="model" :rules="{password:[{required:true,message:'请输入密码'},{min:6,message:'至少 6 个字符'}]}" @submit="message='两次密码一致'"><HysFormItem label="密码" prop="password"><HysInput v-model="model.password" type="password" autocomplete="new-password" show-password/></HysFormItem><HysFormItem label="确认密码" prop="confirm" :rules="confirmRules" :dependencies="['password']" hint="修改上方密码后，此项会重新校验。"><HysInput v-model="model.confirm" type="password" autocomplete="new-password" show-password/></HysFormItem><template #actions><HysButton type="submit">确认密码</HysButton></template></HysForm><output class="state-output">{{message||'字段专属规则会与表单规则合并。通过 dependencies 声明依赖字段。'}}</output></div></template>