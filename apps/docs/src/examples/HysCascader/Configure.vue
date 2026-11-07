<script setup lang="ts">
import { ref } from 'vue';
import { HysCascader } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const nodes = [{ label: '研发中心', value: 'rd', children: [{ label: '后端组', value: 'backend' }, { label: '前端组', value: 'frontend' }, { label: '测试组', value: 'qa', disabled: true }] }, { label: '产品中心', value: 'product' }];
const cascade = ref<string[]>([]);
const demoConfig = demoReactive<{
    disabled: boolean;
    clearable: boolean;
    filterable: boolean;
    changeOnSelect: boolean;
    showAllLevels: boolean;
    separator: string;
    placeholder: string;
}>({ "disabled": false, "clearable": false, "filterable": false, "changeOnSelect": false, "showAllLevels": true, "separator": " / ", "placeholder": "选择分类" });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><DemoCheckbox v-model="demoConfig.filterable" label="filterable"/><DemoCheckbox v-model="demoConfig.changeOnSelect" label="changeOnSelect"/><DemoCheckbox v-model="demoConfig.showAllLevels" label="showAllLevels"/><label class="demo-field">separator<DemoInput v-model="demoConfig.separator"/></label><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label></div><div class="demo-content"><section class="card" style="padding:20px"><HysCascader v-bind="demoConfig" v-model="cascade" :options="nodes"/><p class="hint">路径：{{cascade.join(' / ')||'未选择'}}</p></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
