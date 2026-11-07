<script setup lang="ts">
import { ref } from 'vue';
import { HysRadioGroup } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const radio = ref('dev');
const demoConfig = demoReactive<{
    disabled: boolean;
    vertical: boolean;
}>({ "disabled": false, "vertical": false });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.vertical" label="vertical"/></div><div class="demo-content"><HysRadioGroup v-bind="demoConfig" v-model="radio" name="team" :options="[{label:'开发',value:'dev'},{label:'测试',value:'qa'},{label:'产品',value:'pm'}]"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
