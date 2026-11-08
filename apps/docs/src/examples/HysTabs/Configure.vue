<script setup lang="ts">
import { ref } from 'vue';
import { HysTabs } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect } from 'hys-ui';
const events = ref('');
;
const value = ref('');
const tab = ref('a');
const demoConfig = demoReactive<{
    disabled: boolean;
    type: "line" | "card";
    vertical: boolean;
    closable: boolean;
}>({ "disabled": false, "type": "line", "vertical": false, "closable": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>类型</span><code>type</code></span><DemoSelect :model-value="demoConfig.type" @update:model-value="demoConfig.type=$event as typeof demoConfig.type" :options='[{"label":"line","value":"line"},{"label":"card","value":"card"}]'/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.vertical" label="vertical"/><small>纵向布局</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.closable" label="closable"/><small>允许关闭</small></div></div></section></div><div class="demo-content"><HysTabs v-bind="demoConfig" v-model="tab" :items="[{label:'概览',value:'a'},{label:'任务',value:'b'},{label:'成员',value:'c'}]"/><div class="hint">当前页签：{{tab}}</div><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
