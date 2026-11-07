<script setup lang="ts">
import { computed } from 'vue';
import { HysVirtualTable } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const rows = computed(() => Array.from({ length: 10000 }, (_, i) => ({ id: i + 1, title: `项目任务 #${i + 1}`, owner: ['Keller', 'Lisa', 'David'][i % 3], status: ['待办', '进行中', '已完成'][i % 3] })));
const demoConfig = demoReactive<{
    rowHeight: number;
    height: number;
    loading: boolean;
    emptyText: string;
}>({ "rowHeight": 42, "height": 280, "loading": false, "emptyText": "自定义emptyText" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">rowHeight<DemoNumber v-model="demoConfig.rowHeight" :show-controls="false"/></label><label class="demo-field">height<DemoNumber v-model="demoConfig.height" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.loading" label="loading"/><label class="demo-field">emptyText<DemoInput v-model="demoConfig.emptyText"/></label></div><div class="demo-content"><section class="card" style="padding:20px"><HysVirtualTable v-bind="demoConfig" :rows="rows" :columns="[{key:'id',label:'ID',width:65},{key:'title',label:'任务名称',width:190},{key:'owner',label:'负责人',width:110},{key:'status',label:'状态',width:100}]"/></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
