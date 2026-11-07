<script setup lang="ts">
import { ref } from 'vue';
import { HysCascader } from 'hys-ui';
const nodes = [{ label: '研发中心', value: 'rd', children: [{ label: '后端组', value: 'backend' }, { label: '前端组', value: 'frontend' }, { label: '测试组', value: 'qa', disabled: true }] }, { label: '产品中心', value: 'product' }];
const cascade = ref<string[]>([]);
</script>
<template><div class="demo-content"><section class="card" style="padding:20px"><HysCascader v-model="cascade" :options="nodes"/><p class="hint">路径：{{cascade.join(' / ')||'未选择'}}</p></section></div></template>
