<script setup lang="ts">
import { ref } from 'vue';
import { HysPagination } from 'hys-ui';
const page = ref(1);
const pageSize = ref(12);
</script>
<template><div class="demo-content"><HysPagination :page="page" :page-size="pageSize" :total="156" show-size-changer show-quick-jumper @change="page=$event" @page-size-change="pageSize=$event;page=1"/><output>第 {{page}} 页 · 每页 {{pageSize}} 条</output></div></template>
