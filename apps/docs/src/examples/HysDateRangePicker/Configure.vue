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
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/></div><div class="demo-content"><section class="card" style="padding:20px"><HysDateRangePicker v-bind="demoConfig" v-model="range"/><p class="hint">{{range.join(' ~ ')}}</p></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
