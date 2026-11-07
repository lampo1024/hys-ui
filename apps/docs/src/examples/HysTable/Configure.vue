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
<template><div><div class="demo-controls"><label class="demo-field">emptyText<DemoInput v-model="demoConfig.emptyText"/></label><DemoCheckbox v-model="demoConfig.loading" label="loading"/><DemoCheckbox v-model="demoConfig.striped" label="striped"/><DemoCheckbox v-model="demoConfig.bordered" label="bordered"/><label class="demo-field">size<DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div><div class="demo-content"><HysTable v-bind="demoConfig" :rows="rows" :columns="[{key:'id',label:'编号'},{key:'name',label:'任务名称'}]"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
