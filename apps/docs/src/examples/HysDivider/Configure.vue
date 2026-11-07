<script setup lang="ts">
import { HysDivider } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput } from 'hys-ui';
const demoConfig = demoReactive<{
    label: string;
    direction: "horizontal" | "vertical";
    dashed: boolean;
    orientation: "center" | "left" | "right";
}>({ "label": "自定义label", "direction": "horizontal", "dashed": false, "orientation": "center" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label><label class="demo-field">direction<DemoSelect :model-value="demoConfig.direction" @update:model-value="demoConfig.direction=$event as typeof demoConfig.direction" :options='[{"label":"horizontal","value":"horizontal"},{"label":"vertical","value":"vertical"}]'/></label><DemoCheckbox v-model="demoConfig.dashed" label="dashed"/><label class="demo-field">orientation<DemoSelect :model-value="demoConfig.orientation" @update:model-value="demoConfig.orientation=$event as typeof demoConfig.orientation" :options='[{"label":"center","value":"center"},{"label":"left","value":"left"},{"label":"right","value":"right"}]'/></label></div><div class="demo-content"><HysDivider v-bind="demoConfig" /><p class="hint">项目基础信息</p><HysDivider label="高级配置"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
