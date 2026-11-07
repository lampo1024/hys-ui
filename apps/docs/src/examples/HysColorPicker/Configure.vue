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
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/></div><div class="demo-content"><section class="card" style="padding:20px"><HysColorPicker v-bind="demoConfig" v-model="color"/><div :style="{background:color,height:'30px',borderRadius:'8px',marginTop:'10px'}"/></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
