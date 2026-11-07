<script setup lang="ts">
import { ref } from 'vue';
import { HysDatePicker } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const events = ref('');
;
const date = ref('2026-11-06');
const demoConfig = demoReactive<{
    disabled: boolean;
    placeholder: string;
    label: string;
    clearable: boolean;
}>({ "disabled": false, "placeholder": "自定义placeholder", "label": "自定义label", "clearable": false });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/></div><div class="demo-content"><HysDatePicker v-bind="demoConfig" v-model="date"/><p class="hint">选中日期：{{date}}。点击年份或月份可快速定位。</p><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
