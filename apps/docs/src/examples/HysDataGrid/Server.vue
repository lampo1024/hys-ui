<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue';
import { HysDataGrid, HysCheckbox, type GridColumn } from 'hys-ui';
const columns: GridColumn[] = [{ key: 'id', label: '编号', width: 100 }, { key: 'name', label: '任务名称', width: 260 }];
const all = Array.from({ length: 45 }, (_, i) => ({ id: i + 1, name: '远程任务 ' + (i + 1) }));
const rows = ref(all.slice(0, 10));
const page = ref(1);
const size = ref(10);
const total = ref(all.length);
const loading = ref(false);
const fail = ref(false);
const message = ref('');
let timer: ReturnType<typeof setTimeout> | undefined;
function load(query: {
    page: number;
    pageSize: number;
    search: string;
    filters: Record<string, string>;
    sort: {
        key: string;
        direction: 'asc' | 'desc';
    }[];
}) {
    clearTimeout(timer);
    loading.value = true;
    page.value = query.page;
    size.value = query.pageSize;
    timer = setTimeout(() => {
        loading.value = false;
        if (fail.value) {
            rows.value = [];
            message.value = '模拟请求失败，请取消勾选并重新查询';
            return;
        }
        let result = all.filter(row => Object.values(row).some(value => String(value).includes(query.search)) && Object.entries(query.filters).every(([key, value]) => String(row[key as keyof typeof row]).includes(value)));
        for (const sort of [...query.sort].reverse())
            result = [...result].sort((a, b) => String(a[sort.key as keyof typeof a]).localeCompare(String(b[sort.key as keyof typeof b]), 'zh-CN', { numeric: true }) * (sort.direction === 'asc' ? 1 : -1));
        total.value = result.length;
        rows.value = result.slice((page.value - 1) * size.value, page.value * size.value);
        message.value = '请求完成：' + rows.value.length + ' 条';
    }, 300);
}
onBeforeUnmount(() => clearTimeout(timer));
</script>
<template><div><HysCheckbox v-model="fail" label="模拟请求失败"/><HysDataGrid :rows="rows" :columns="columns" server-mode :total-rows="total" :page="page" :page-size="size" :loading="loading" :empty-text="fail?'请求失败，请重试':'暂无结果'" @query-change="load"/><output aria-live="polite">{{message||'分页、排序和筛选会触发模拟远程查询。'}}</output></div></template>
