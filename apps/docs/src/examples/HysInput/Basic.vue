<script setup lang="ts">
import { ref } from 'vue';
import { HysInput } from 'hys-ui';
const events = ref('');
;
const value = ref('');
const errorValue = ref('');
</script>
<template><div class="demo-content"><div class="demo-stack"><HysInput v-model="value" placeholder="请输入项目名称" clearable/><HysInput v-model="errorValue" placeholder="输入错误状态" error="请输入正确内容"/><HysInput type="password" placeholder="密码输入框"/><HysInput placeholder="禁用输入框" disabled/></div><output v-if="events" aria-live="polite">{{events}}</output></div></template>
