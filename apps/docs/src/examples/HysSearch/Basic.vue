<script setup lang="ts">
import { ref } from 'vue';
import { HysSearch } from 'hys-ui';
const search = ref('');
</script>
<template><div class="demo-content"><HysSearch v-model="search" placeholder="搜索项目或任务"/><p class="hint">关键词：{{search||'无'}}</p></div></template>
