<script setup lang="ts">
import { ref } from 'vue';
import { HysRating } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysNumberInput as DemoNumber } from 'hys-ui';
const rating = ref(4);
const demoConfig = demoReactive<{
    max: number;
    readonly: boolean;
    disabled: boolean;
    allowClear: boolean;
    allowHalf: boolean;
    showScore: boolean;
}>({ "max": 5, "readonly": false, "disabled": false, "allowClear": true, "allowHalf": false, "showScore": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>最大值</span><code>max</code></span><DemoNumber v-model="demoConfig.max" :show-controls="false"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><small>只读模式</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.allowClear" label="allowClear"/></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.allowHalf" label="allowHalf"/></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showScore" label="showScore"/></div></div></section></div><div class="demo-content"><HysRating v-bind="demoConfig" v-model="rating"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
