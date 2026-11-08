<script setup lang="ts">
import { ref } from 'vue';
import { HysSplitPane } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysNumberInput as DemoNumber } from 'hys-ui';
const toast = ref('');
const split = ref(40);
const demoConfig = demoReactive<{
    min: number;
    max: number;
    vertical: boolean;
    disabled: boolean;
}>({ "min": 15, "max": 85, "vertical": false, "disabled": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>最小值</span><code>min</code></span><DemoNumber v-model="demoConfig.min" :show-controls="false"/></label>
<label class="demo-field"><span class="demo-control-label"><span>最大值</span><code>max</code></span><DemoNumber v-model="demoConfig.max" :show-controls="false"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.vertical" label="vertical"/><small>纵向布局</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div></div></section></div><div class="demo-content"><section class="ent-gallery-section"><HysSplitPane v-bind="demoConfig" v-model="split"><template #first><div style="padding:12px">左侧面板 {{split}}%</div></template><template #second><div style="padding:12px">右侧面板</div></template></HysSplitPane></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
