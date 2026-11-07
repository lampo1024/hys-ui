<script setup lang="ts">
import { ref } from 'vue';
import { HysSortableList } from 'hys-ui';
const sorted = ref([{ id: 'a', label: '需求评审' }, { id: 'b', label: '技术设计' }, { id: 'c', label: '代码审查' }, { id: 'd', label: '发布上线' }]);
</script>
<template><div class="demo-content"><section class="card" style="padding:20px"><HysSortableList v-model="sorted"/><p class="hint">支持拖拽和上移、下移按钮</p></section></div></template>
