<script setup lang="ts">
import { ref } from 'vue';
import { HysSlider } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const slider = ref(60);
const demoConfig = demoReactive<{
    min: number;
    max: number;
    step: number;
    disabled: boolean;
    label: string;
    showValue: boolean;
}>({ "min": 0, "max": 100, "step": 1, "disabled": false, "label": "自定义label", "showValue": true });
</script>
<template><div><div class="demo-controls"><label class="demo-field">min<DemoNumber v-model="demoConfig.min" :show-controls="false"/></label><label class="demo-field">max<DemoNumber v-model="demoConfig.max" :show-controls="false"/></label><label class="demo-field">step<DemoNumber v-model="demoConfig.step" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label><DemoCheckbox v-model="demoConfig.showValue" label="showValue"/></div><div class="demo-content"><HysSlider v-bind="demoConfig" v-model="slider" /></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
