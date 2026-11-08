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
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>占位文字</span><code>placeholder</code></span><DemoInput v-model="demoConfig.placeholder"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><small>允许清空</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.searchable" label="searchable"/><small>显示搜索</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.leafOnly" label="leafOnly"/><small>仅可选择叶子</small></div></div></section></div><div class="demo-content"><section class="card" style="padding:20px"><HysTreeSelect v-bind="demoConfig" v-model="tree" :nodes="nodes"/><p class="hint">选中：{{tree}}</p></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
