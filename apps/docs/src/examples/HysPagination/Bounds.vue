<script setup lang="ts">
import { ref } from 'vue'
import { HysButton,HysPagination } from 'hys-ui'
const page=ref(10),pageSize=ref(10)
</script>
<template><div><div class="demo-content"><p class="scenario-note">初始位于最后一页。增大每页条数时，组件会同步调整超出范围的页码；跳转框聚焦后可直接覆盖原页码。</p><HysPagination v-model:page="page" v-model:page-size="pageSize" :total="100" :page-size-options="[10,20,50]" show-size-changer show-quick-jumper/><div class="demo-row"><HysButton variant="secondary" size="sm" @click="page=10;pageSize=10">恢复最后一页</HysButton></div></div><output class="state-output">当前页：{{page}} · 每页条数：{{pageSize}}</output></div></template>
