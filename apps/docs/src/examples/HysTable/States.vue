<script setup lang="ts">
import { HysTable } from 'hys-ui';
const rows = [{ id: 1, name: '需求评审' }, { id: 2, name: '技术设计' }];
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><HysTable :rows="[]" :columns="[{key:'id',label:'编号'},{key:'name',label:'任务名称'}]"/></div></div></template>
