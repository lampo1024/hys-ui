<script setup lang="ts">
import { ref } from 'vue';
import { HysSelect } from 'hys-ui';
const value = ref<string[]>(['vue']);
const options = [{ label: 'Vue', value: 'vue' }, { label: 'TypeScript', value: 'ts' }, { label: '不可选', value: 'disabled', disabled: true }, { label: 'Vite', value: 'vite' }];
</script>
<template><div><HysSelect v-model="value" :options="options" multiple filterable clearable placeholder="搜索并选择多个标签"/><output>{{value}}</output></div></template>
