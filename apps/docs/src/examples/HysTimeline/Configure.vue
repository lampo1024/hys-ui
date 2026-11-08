<script setup lang="ts">
import { HysTimeline } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const demoConfig = demoReactive<{
    reverse: boolean;
}>({ "reverse": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.reverse" label="reverse"/></div></div></section></div><div class="demo-content"><HysTimeline v-bind="demoConfig" :items="[{title:'需求评审完成',time:'11-01',status:'done'},{title:'开发进行中',time:'11-06',status:'current'},{title:'发布上线',time:'11-15',status:'pending'}]"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
