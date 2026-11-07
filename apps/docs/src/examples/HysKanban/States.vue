<script setup lang="ts">
import { ref } from 'vue';
import { HysKanban } from 'hys-ui';
const toast = ref('');
const cards = ref([{ id: '1', title: '设计数据库', column: 'todo', owner: '张工' }, { id: '2', title: '开发接口', column: 'doing', owner: '李工' }]);
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="ent-gallery-section"><HysKanban :columns="[{id:'todo',title:'待办'},{id:'doing',title:'进行中'},{id:'done',title:'已完成'}]" :cards="[]" @move="(id,col)=>cards=cards.map(c=>c.id===id?{...c,column:col}:c)"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></div></template>
