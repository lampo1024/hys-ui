<script setup lang="ts">
import { HysTooltip, HysButton } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const demoConfig = demoReactive<{
    text: string;
    disabled: boolean;
    showDelay: number;
    hideDelay: number;
}>({ "text": "自定义text", "disabled": false, "showDelay": 0, "hideDelay": 70 });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>文本</span><code>text</code></span><DemoInput v-model="demoConfig.text"/></label>
<label class="demo-field">showDelay<DemoNumber v-model="demoConfig.showDelay" :show-controls="false"/></label>
<label class="demo-field">hideDelay<DemoNumber v-model="demoConfig.hideDelay" :show-controls="false"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div></div></section></div><div class="demo-content"><HysTooltip v-bind="demoConfig" ><HysButton variant="secondary">查看提示</HysButton></HysTooltip></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
