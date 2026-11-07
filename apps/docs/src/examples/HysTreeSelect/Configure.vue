<script setup lang="ts">
import { ref } from 'vue';
import { HysTreeSelect } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const nodes = [{ label: '研发中心', value: 'rd', children: [{ label: '后端组', value: 'backend' }, { label: '前端组', value: 'frontend' }, { label: '测试组', value: 'qa', disabled: true }] }, { label: '产品中心', value: 'product' }];
const tree = ref('backend');
const demoConfig = demoReactive<{
    placeholder: string;
    disabled: boolean;
    clearable: boolean;
    searchable: boolean;
    leafOnly: boolean;
}>({ "placeholder": "自定义placeholder", "disabled": false, "clearable": false, "searchable": true, "leafOnly": false });
</script>
<template><div><div class="demo-controls"><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><DemoCheckbox v-model="demoConfig.searchable" label="searchable"/><DemoCheckbox v-model="demoConfig.leafOnly" label="leafOnly"/></div><div class="demo-content"><section class="card" style="padding:20px"><HysTreeSelect v-bind="demoConfig" v-model="tree" :nodes="nodes"/><p class="hint">选中：{{tree}}</p></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
