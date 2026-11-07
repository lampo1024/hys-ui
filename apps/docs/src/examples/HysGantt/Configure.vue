<script setup lang="ts">
import { ref } from 'vue';
import { HysGantt, type GanttItem } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysNumberInput as DemoNumber } from 'hys-ui';
const items = ref<GanttItem[]>([{ id: 1, title: '需求评审', start: '2026-11-01', end: '2026-11-07', progress: 100 }, { id: 2, title: '技术实现', start: '2026-11-08', end: '2026-11-18', progress: 35, dependencies: [1] }]);
const demoConfig = demoReactive<{
    rowHeight: number;
    labelWidth: number;
}>({ "rowHeight": 46, "labelWidth": 270 });
</script>
<template><div><div class="demo-controls"><label class="demo-field">rowHeight<DemoNumber v-model="demoConfig.rowHeight" :show-controls="false"/></label><label class="demo-field">labelWidth<DemoNumber v-model="demoConfig.labelWidth" :show-controls="false"/></label></div><div class="demo-content"><HysGantt v-bind="demoConfig" v-model:items="items" editable/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
