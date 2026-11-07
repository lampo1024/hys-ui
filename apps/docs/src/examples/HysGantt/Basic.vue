<script setup lang="ts">
import { ref } from 'vue';
import { HysGantt, type GanttItem } from 'hys-ui';
const items = ref<GanttItem[]>([{ id: 1, title: '需求评审', start: '2026-11-01', end: '2026-11-07', progress: 100 }, { id: 2, title: '技术实现', start: '2026-11-08', end: '2026-11-18', progress: 35, dependencies: [1] }]);
</script>
<template><div class="demo-content"><HysGantt v-model:items="items" editable/></div></template>
