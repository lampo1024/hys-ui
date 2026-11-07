<script setup lang="ts">
import { HysSteps } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect } from 'hys-ui';
const demoConfig = demoReactive<{
    vertical: boolean;
    clickable: boolean;
    status: "error" | "process" | "finish" | "wait";
}>({ "vertical": false, "clickable": false, "status": "error" });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.vertical" label="vertical"/><DemoCheckbox v-model="demoConfig.clickable" label="clickable"/><label class="demo-field">status<DemoSelect :model-value="demoConfig.status" @update:model-value="demoConfig.status=$event as typeof demoConfig.status" :options='[{"label":"error","value":"error"},{"label":"process","value":"process"},{"label":"finish","value":"finish"},{"label":"wait","value":"wait"}]'/></label></div><div class="demo-content"><HysSteps v-bind="demoConfig" :items="['需求评审','技术设计','开发测试','发布']" :current="2"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
