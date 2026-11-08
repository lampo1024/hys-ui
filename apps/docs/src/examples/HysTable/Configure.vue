<script setup lang="ts">
import { HysTable } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput } from 'hys-ui';
const rows = [{ id: 1, name: '需求评审' }, { id: 2, name: '技术设计' }];
const demoConfig = demoReactive<{
    emptyText: string;
    loading: boolean;
    striped: boolean;
    bordered: boolean;
    size: "md" | "sm" | "lg";
}>({ "emptyText": "自定义emptyText", "loading": false, "striped": false, "bordered": false, "size": "md" });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>空数据提示</span><code>emptyText</code></span><DemoInput v-model="demoConfig.emptyText"/></label>
<label class="demo-field"><span class="demo-control-label"><span>尺寸</span><code>size</code></span><DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.loading" label="loading"/><small>加载状态</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.striped" label="striped"/></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.bordered" label="bordered"/><small>显示边框</small></div></div></section></div><div class="demo-content"><HysTable v-bind="demoConfig" :rows="rows" :columns="[{key:'id',label:'编号'},{key:'name',label:'任务名称'}]"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
