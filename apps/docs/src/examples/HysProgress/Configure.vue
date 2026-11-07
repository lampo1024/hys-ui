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
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.showLabel" label="showLabel"/><label class="demo-field">status<DemoSelect :model-value="demoConfig.status" @update:model-value="demoConfig.status=$event as typeof demoConfig.status" :options='[{"label":"success","value":"success"},{"label":"warning","value":"warning"},{"label":"error","value":"error"},{"label":"normal","value":"normal"}]'/></label><label class="demo-field">strokeWidth<DemoNumber v-model="demoConfig.strokeWidth" :show-controls="false"/></label><label class="demo-field">type<DemoSelect :model-value="demoConfig.type" @update:model-value="demoConfig.type=$event as typeof demoConfig.type" :options='[{"label":"circle","value":"circle"},{"label":"line","value":"line"}]'/></label><label class="demo-field">width<DemoNumber v-model="demoConfig.width" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.indeterminate" label="indeterminate"/></div><div class="demo-content"><div class="demo-stack"><HysProgress v-bind="demoConfig" :value="72"/><HysProgress :value="85" color="#10b981"/><HysProgress :value="35" color="#f59e0b"/></div><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
