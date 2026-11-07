<script setup lang="ts">
import { ref } from 'vue';
import { HysCommandPalette } from 'hys-ui';
const selectedCommand = ref('暂无');
</script>
<template><div class="demo-content"><section class="card" style="padding:20px"><HysCommandPalette :actions="[{id:'create',label:'新建项目',description:'创建研发项目'},{id:'search',label:'搜索任务',description:'打开任务搜索'},{id:'release',label:'发布检查',description:'检查发布门禁'}]" @select="selectedCommand=$event"/><p class="hint">最近选择：{{selectedCommand}}</p></section></div></template>
