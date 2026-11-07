<script setup lang="ts">
import { ref } from 'vue';
import { HysTreeSelect } from 'hys-ui';
const nodes = [{ label: '研发中心', value: 'rd', children: [{ label: '后端组', value: 'backend' }, { label: '前端组', value: 'frontend' }, { label: '测试组', value: 'qa', disabled: true }] }, { label: '产品中心', value: 'product' }];
const tree = ref('backend');
</script>
<template><div class="demo-content"><section class="card" style="padding:20px"><HysTreeSelect v-model="tree" :nodes="nodes"/><p class="hint">选中：{{tree}}</p></section></div></template>
