<script setup lang="ts">
import { ref } from 'vue';
import { HysTagInput } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const tags = ref(['Vue 3', 'TypeScript']);
const demoConfig = demoReactive<{
    max: number;
    placeholder: string;
    disabled: boolean;
    readonly: boolean;
    addOnBlur: boolean;
    separator: string;
}>({ "max": 10, "placeholder": "输入后按 Enter", "disabled": false, "readonly": false, "addOnBlur": true, "separator": "自定义separator" });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>最大值</span><code>max</code></span><DemoNumber v-model="demoConfig.max" :show-controls="false"/></label>
<label class="demo-field"><span class="demo-control-label"><span>占位文字</span><code>placeholder</code></span><DemoInput v-model="demoConfig.placeholder"/></label>
<label class="demo-field">separator<DemoInput v-model="demoConfig.separator"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><small>只读模式</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.addOnBlur" label="addOnBlur"/></div></div></section></div><div class="demo-content"><HysTagInput v-bind="demoConfig" v-model="tags"/><p class="hint">按 Enter 添加，Backspace 删除</p></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
