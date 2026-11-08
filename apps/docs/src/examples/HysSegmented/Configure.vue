<script setup lang="ts">
import { ref } from 'vue';
import { HysSegmented } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect } from 'hys-ui';
const segment = ref('week');
const demoConfig = demoReactive<{
    disabled: boolean;
    block: boolean;
    size: "md" | "sm" | "lg";
}>({ "disabled": false, "block": false, "size": "md" });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>尺寸</span><code>size</code></span><DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.block" label="block"/><small>铺满宽度</small></div></div></section></div><div class="demo-content"><HysSegmented v-bind="demoConfig" v-model="segment" :options="[{label:'日',value:'day'},{label:'周',value:'week'},{label:'月',value:'month'}]"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
