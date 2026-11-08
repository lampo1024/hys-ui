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
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field">rowHeight<DemoNumber v-model="demoConfig.rowHeight" :show-controls="false"/></label>
<label class="demo-field"><span class="demo-control-label"><span>高度</span><code>height</code></span><DemoNumber v-model="demoConfig.height" :show-controls="false"/></label>
<label class="demo-field"><span class="demo-control-label"><span>空数据提示</span><code>emptyText</code></span><DemoInput v-model="demoConfig.emptyText"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.loading" label="loading"/><small>加载状态</small></div></div></section></div><div class="demo-content"><section class="card" style="padding:20px"><HysVirtualTable v-bind="demoConfig" :rows="rows" :columns="[{key:'id',label:'ID',width:65},{key:'title',label:'任务名称',width:190},{key:'owner',label:'负责人',width:110},{key:'status',label:'状态',width:100}]"/></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
