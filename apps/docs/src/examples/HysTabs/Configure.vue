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
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><label class="demo-field">type<DemoSelect :model-value="demoConfig.type" @update:model-value="demoConfig.type=$event as typeof demoConfig.type" :options='[{"label":"line","value":"line"},{"label":"card","value":"card"}]'/></label><DemoCheckbox v-model="demoConfig.vertical" label="vertical"/><DemoCheckbox v-model="demoConfig.closable" label="closable"/></div><div class="demo-content"><HysTabs v-bind="demoConfig" v-model="tab" :items="[{label:'概览',value:'a'},{label:'任务',value:'b'},{label:'成员',value:'c'}]"/><div class="hint">当前页签：{{tab}}</div><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
