<script setup lang="ts">
import {reactive,ref} from 'vue'
import {HysForm,HysFormItem,HysInput,HysButton,type HysFormRule} from 'hys-ui'
let serial=1
const model=reactive({contacts:[{id:1,email:''}]}),message=ref('')
const rules:HysFormRule[]=[{required:true,message:'请输入联系邮箱'},{type:'email',message:'联系邮箱格式不正确'}]
function add(){model.contacts.push({id:++serial,email:''})}
</script>
<template><div class="demo-content"><HysForm :model="model" @submit="message='联系方式校验成功'" @invalid="message='请检查各项邮箱'"><div v-for="(contact,index) in model.contacts" :key="contact.id" class="form-demo-dynamic-row"><HysFormItem :label="'联系邮箱 '+(index+1)" :prop="['contacts',index,'email']" :rules="rules"><HysInput v-model="contact.email" placeholder="name@example.com"/></HysFormItem><HysButton variant="ghost" :aria-label="'移除联系邮箱 '+(index+1)" @click="model.contacts.splice(index,1)">移除</HysButton></div><template #actions><HysButton type="submit">验证联系方式</HysButton><HysButton variant="secondary" @click="add">添加联系方式</HysButton></template></HysForm><output class="state-output">{{message||'可添加、移除多个联系邮箱；路径可使用数组或点号字符串。'}}</output></div></template>
<style scoped>.form-demo-dynamic-row{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:start}.form-demo-dynamic-row>.hys-ui-btn{margin-top:23px}@media(max-width:520px){.form-demo-dynamic-row{grid-template-columns:minmax(0,1fr)}.form-demo-dynamic-row>.hys-ui-btn{margin-top:-8px;margin-bottom:16px;justify-self:start}}</style>