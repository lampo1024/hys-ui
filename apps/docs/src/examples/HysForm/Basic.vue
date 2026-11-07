<script setup lang="ts">
import { ref } from 'vue';
import { HysForm, HysFormItem, HysInput, HysButton } from 'hys-ui';
const name = ref('');
const message = ref('');
</script>
<template><div class="demo-content"><HysForm :validate="()=>!!name.trim()" @submit="message='校验通过'" @invalid="message='请输入名称'"><HysFormItem label="名称" required :error="message==='请输入名称'?message:undefined"><HysInput v-model="name" placeholder="输入名称"/></HysFormItem><template #actions><HysButton type="submit">提交</HysButton></template></HysForm><output>{{message}}</output></div></template>
