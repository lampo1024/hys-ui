<script setup lang="ts">
import { ref } from 'vue';
import { HysDateRangePicker } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const range = ref<[
    string,
    string
]>(['2026-11-01', '2026-11-30']);
const demoConfig = demoReactive<{
    disabled: boolean;
    placeholder: string;
    label: string;
    clearable: boolean;
}>({ "disabled": false, "placeholder": "自定义placeholder", "label": "自定义label", "clearable": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>占位文字</span><code>placeholder</code></span><DemoInput v-model="demoConfig.placeholder"/></label>
<label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><small>允许清空</small></div></div></section></div><div class="demo-content"><section class="card" style="padding:20px"><HysDateRangePicker v-bind="demoConfig" v-model="range"/><p class="hint">{{range.join(' ~ ')}}</p></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
