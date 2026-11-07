<script setup lang="ts">
import { ref } from 'vue';
import { HysTransfer } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const members = ref<string[]>(['lisa']);
const demoConfig = demoReactive<{
    disabled: boolean;
    filterable: boolean;
}>({ "disabled": false, "filterable": false });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.filterable" label="filterable"/></div><div class="demo-content"><section class="card" style="padding:20px"><HysTransfer v-bind="demoConfig" v-model="members" :options="[{label:'Keller',value:'keller'},{label:'Lisa',value:'lisa'},{label:'David',value:'david'},{label:'Amy',value:'amy'}]"/></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
