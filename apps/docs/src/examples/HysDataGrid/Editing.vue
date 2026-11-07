<script setup lang="ts">
import { ref } from 'vue';
import { HysDataGrid, type GridColumn } from 'hys-ui';
const columns: GridColumn[] = [{ key: 'id', label: '编号', width: 100 }, { key: 'name', label: '任务名称', width: 240, editable: true }, { key: 'owner', label: '负责人', width: 160, editable: true }];
const rows = ref<Record<string, unknown>[]>([{ id: 1, name: '需求评审', owner: '张工' }, { id: 2, name: '接口设计', owner: '李工' }]);
const message = ref('');
function update(rowKey: string | number, column: string, value: string) { rows.value = rows.value.map(row => row.id === rowKey ? { ...row, [column]: value } : row); message.value = `已更新 ${rowKey}.${column}`; }
</script>
<template><div><p class="scenario-note">双击单元格编辑，Enter 保存，Escape 取消。勾选多行后可批量修改。</p><HysDataGrid :rows="rows" :columns="columns" editable @cell-edit="payload=>update(payload.rowKey,payload.column,payload.value)" @batch-edit="payload=>payload.keys.forEach(key=>update(key,payload.column,payload.value))"/><output aria-live="polite">{{message}}</output></div></template>
