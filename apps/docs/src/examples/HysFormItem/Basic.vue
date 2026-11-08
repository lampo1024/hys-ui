<script setup lang="ts">
import {ref} from 'vue'
import {HysFormItem,HysInput} from 'hys-ui'
const name=ref(''),email=ref('')
</script>
<template><div class="demo-content"><HysFormItem label="姓名" required hint="必填标记不代替校验规则。"><HysInput v-model="name" placeholder="输入姓名"/></HysFormItem><HysFormItem label="外部错误" error="此邮箱暂时不可用" hint="也可以同时保留辅助说明。"><HysInput v-model="email" placeholder="name@example.com"/></HysFormItem><p class="scenario-note">表单项会关联标签、输入框与反馈信息。独立使用时可传入 error；规则校验需要配合 HysForm 的 model 与 prop。</p></div></template>