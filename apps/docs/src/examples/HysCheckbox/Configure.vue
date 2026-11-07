<script setup lang="ts">
import { ref } from 'vue';
import { HysCheckbox } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const checked = ref(false);
const demoConfig = demoReactive<{
    label: string;
    disabled: boolean;
    readonly: boolean;
    required: boolean;
    indeterminate: boolean;
}>({ "label": "自定义label", "disabled": false, "readonly": false, "required": false, "indeterminate": false });
</script>
<template><div><div class="demo-controls"><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><DemoCheckbox v-model="demoConfig.required" label="required"/><DemoCheckbox v-model="demoConfig.indeterminate" label="indeterminate"/></div><div class="demo-content"><HysCheckbox v-bind="demoConfig" v-model="checked" /><HysCheckbox :model-value="false" indeterminate label="部分选中"/><output>选中：{{checked}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
