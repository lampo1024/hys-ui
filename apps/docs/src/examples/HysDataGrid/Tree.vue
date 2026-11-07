<script setup lang="ts">
import { HysDataGrid, type GridColumn } from 'hys-ui';
const columns: GridColumn[] = [{ key: 'name', label: '任务', width: 260 }, { key: 'hours', label: '工时', summary: 'sum', align: 'right', width: 120 }];
const rows = [{ id: 'a', name: '平台迭代', hours: 8 }, { id: 'b', parentId: 'a', name: '需求设计', hours: 3 }, { id: 'c', parentId: 'a', name: '接口实现', hours: 5 }, { id: 'd', name: '质量保障', hours: 4 }];
</script>
<template><HysDataGrid :rows="rows" :columns="columns" tree-mode show-summary :selectable="false"/></template>
