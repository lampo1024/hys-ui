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
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field">separator<DemoInput v-model="demoConfig.separator"/></label>
<label class="demo-field"><span class="demo-control-label"><span>占位文字</span><code>placeholder</code></span><DemoInput v-model="demoConfig.placeholder"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><small>允许清空</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.filterable" label="filterable"/><small>允许搜索</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.changeOnSelect" label="changeOnSelect"/><small>选择任意层级</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showAllLevels" label="showAllLevels"/><small>显示完整路径</small></div></div></section></div><div class="demo-content"><section class="card" style="padding:20px"><HysCascader v-bind="demoConfig" v-model="cascade" :options="nodes"/><p class="hint">路径：{{cascade.join(' / ')||'未选择'}}</p></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
