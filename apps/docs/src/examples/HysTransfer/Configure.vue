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
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.filterable" label="filterable"/><small>允许搜索</small></div></div></section></div><div class="demo-content"><section class="card" style="padding:20px"><HysTransfer v-bind="demoConfig" v-model="members" :options="[{label:'Keller',value:'keller'},{label:'Lisa',value:'lisa'},{label:'David',value:'david'},{label:'Amy',value:'amy'}]"/></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
