<script setup lang="ts">
import {reactive,ref} from 'vue'
import {HysForm,HysFormItem,HysInput,HysButton,type HysFormRules} from 'hys-ui'
const model=reactive({title:'短名称'}),message=ref('')
const rules:HysFormRules={title:[{required:true,message:'名称不能为空'},{min:8,level:'warning',message:'建议使用更具体的名称，便于区分'}]}
</script>
<template><div class="demo-content"><HysForm :model="model" :rules="rules" @submit="message='提交成功，提示不会阻止提交'"><HysFormItem label="名称" prop="title" hint="警告仅用于建议；错误会阻止提交。" feedback-icon><HysInput v-model="model.title"/><template #warning="{warning}"><strong>建议：</strong>{{warning}}</template></HysFormItem><template #actions><HysButton type="submit">提交并查看提示</HysButton></template></HysForm><output class="state-output">{{message||'提交后查看提示状态，也可以清空名称查看错误状态。'}}</output></div></template>