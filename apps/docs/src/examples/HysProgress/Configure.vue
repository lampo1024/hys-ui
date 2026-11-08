<script setup lang="ts">
import { ref } from 'vue';
import { HysProgress } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysNumberInput as DemoNumber } from 'hys-ui';
const events = ref('');
;
const value = ref('');
const demoConfig = demoReactive<{
    showLabel: boolean;
    status: "success" | "warning" | "error" | "normal";
    strokeWidth: number;
    type: "circle" | "line";
    width: number;
    indeterminate: boolean;
}>({ "showLabel": true, "status": "normal", "strokeWidth": 7, "type": "line", "width": 100, "indeterminate": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>状态</span><code>status</code></span><DemoSelect :model-value="demoConfig.status" @update:model-value="demoConfig.status=$event as typeof demoConfig.status" :options='[{"label":"success","value":"success"},{"label":"warning","value":"warning"},{"label":"error","value":"error"},{"label":"normal","value":"normal"}]'/></label>
<label class="demo-field">strokeWidth<DemoNumber v-model="demoConfig.strokeWidth" :show-controls="false"/></label>
<label class="demo-field"><span class="demo-control-label"><span>类型</span><code>type</code></span><DemoSelect :model-value="demoConfig.type" @update:model-value="demoConfig.type=$event as typeof demoConfig.type" :options='[{"label":"circle","value":"circle"},{"label":"line","value":"line"}]'/></label>
<label class="demo-field"><span class="demo-control-label"><span>宽度</span><code>width</code></span><DemoNumber v-model="demoConfig.width" :show-controls="false"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showLabel" label="showLabel"/></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.indeterminate" label="indeterminate"/></div></div></section></div><div class="demo-content"><div class="demo-stack"><HysProgress v-bind="demoConfig" :value="72"/><HysProgress :value="85" color="#10b981"/><HysProgress :value="35" color="#f59e0b"/></div><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
