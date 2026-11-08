<script setup lang="ts">
import { ref } from 'vue';
import { HysNumberInput } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysNumberInput as DemoNumber } from 'hys-ui';
const num = ref(3);
const demoConfig = demoReactive<{
    step: number;
    stepStrictly: boolean;
    disabled: boolean;
    readonly: boolean;
    showControls: boolean;
    selectOnFocus: boolean;
    size: "md" | "sm" | "lg";
}>({ "step": 1, "stepStrictly": false, "disabled": false, "readonly": false, "showControls": true, "selectOnFocus": false, "size": "md" });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>步长</span><code>step</code></span><DemoNumber v-model="demoConfig.step" :show-controls="false"/></label>
<label class="demo-field"><span class="demo-control-label"><span>尺寸</span><code>size</code></span><DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.stepStrictly" label="stepStrictly"/><small>严格步进</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><small>只读模式</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showControls" label="showControls"/><small>显示加减按钮</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.selectOnFocus" label="selectOnFocus"/><small>聚焦时全选</small></div></div></section></div><div class="demo-content"><div class="demo-stack"><HysNumberInput v-bind="demoConfig" v-model="num" :min="0" :max="20"/><HysNumberInput v-model="num" :min="0" :max="20" :show-controls="false" aria-label="无加减按钮的数值"/><small class="muted">可通过 showControls 切换加减按钮显示</small></div></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
