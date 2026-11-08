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
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>状态</span><code>status</code></span><DemoSelect :model-value="demoConfig.status" @update:model-value="demoConfig.status=$event as typeof demoConfig.status" :options='[{"label":"error","value":"error"},{"label":"process","value":"process"},{"label":"finish","value":"finish"},{"label":"wait","value":"wait"}]'/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.vertical" label="vertical"/><small>纵向布局</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.clickable" label="clickable"/><small>允许点击</small></div></div></section></div><div class="demo-content"><HysSteps v-bind="demoConfig" :items="['需求评审','技术设计','开发测试','发布']" :current="2"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
