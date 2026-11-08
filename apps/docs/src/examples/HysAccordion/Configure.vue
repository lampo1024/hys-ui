<script setup lang="ts">
import { HysAccordion } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const demoConfig = demoReactive<{
    disabled: boolean;
}>({ "disabled": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div></div></section></div><div class="demo-content"><HysAccordion v-bind="demoConfig" :items="[{title:'准入条件',content:'需求已评审，技术方案已批准。'},{title:'准出条件',content:'测试通过，发布审批完成。'}]"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
