<script setup lang="ts">
import {ref} from 'vue'
import {HysTabs,type HysTabValue} from 'hys-ui'
const active=ref<HysTabValue>('overview')
const items=[{label:'概览',value:'overview',content:'查看当前空间的整体信息。'},{label:'活动',value:'activity',content:'查看最近的操作与活动记录。'},{label:'成员',value:'members',content:'查看空间成员与协作信息。'}]
</script>
<template><div class="demo-content"><HysTabs v-model="active" :items="items"/><output class="state-output">当前页签：{{active}}</output></div></template>