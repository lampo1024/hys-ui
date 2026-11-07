<script setup lang="ts">
import { ref } from 'vue';
import { HysTreeSelect } from 'hys-ui';
const value = ref<string[]>([]);
const nodes = [{ label: '研发中心', value: 'rd', children: [{ label: '平台组', value: 'platform' }, { label: '质量组', value: 'quality', disabled: true }] }, { label: '产品中心', value: 'product' }];
</script>
<template><div><HysTreeSelect v-model="value" :nodes="nodes" multiple clearable leaf-only/><output>仅叶子节点可选：{{value}}</output></div></template>
