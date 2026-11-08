<script setup lang="ts">
import { ref } from 'vue';
import { HysCheckbox } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const checked = ref(false);
const demoConfig = demoReactive<{
    label: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    indeterminate: boolean;
}>({ "label": "自定义label", "disabled": false, "readonly": false, "required": false, "indeterminate": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><small>只读模式</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.required" label="required"/><small>必填</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.indeterminate" label="indeterminate"/></div></div></section></div><div class="demo-content"><HysCheckbox v-bind="demoConfig" v-model="checked" /><HysCheckbox :model-value="false" indeterminate label="部分选中"/><output>选中：{{checked}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
