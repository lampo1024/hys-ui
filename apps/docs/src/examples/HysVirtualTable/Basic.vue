<script setup lang="ts">
import { computed } from 'vue';
import { HysVirtualTable } from 'hys-ui';
const rows = computed(() => Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, title: `项目任务 #${i + 1}`, owner: ['Keller', 'Lisa', 'David'][i % 3], status: ['待办', '进行中', '已完成'][i % 3] })));
</script>
<template><div class="demo-content"><section class="card" style="padding:20px"><HysVirtualTable :rows="rows" :columns="[{key:'id',label:'ID',width:65},{key:'title',label:'任务名称',width:190},{key:'owner',label:'负责人',width:110},{key:'status',label:'状态',width:100}]"/></section></div></template>
