<script setup lang="ts">
import { ref } from 'vue';
import { HysColorPicker } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const color = ref('#3867f5');
const demoConfig = demoReactive<{
    disabled: boolean;
    label: string;
    clearable: boolean;
}>({ "disabled": false, "label": "自定义label", "clearable": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><small>允许清空</small></div></div></section></div><div class="demo-content"><section class="card" style="padding:20px"><HysColorPicker v-bind="demoConfig" v-model="color"/><div :style="{background:color,height:'30px',borderRadius:'8px',marginTop:'10px'}"/></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
