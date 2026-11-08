<script setup lang="ts">
import { ref } from 'vue';
import { HysInput } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput } from 'hys-ui';
const events = ref('');
;
const value = ref('');
const errorValue = ref('');
const demoConfig = demoReactive<{
    placeholder: string;
    disabled: boolean;
    readonly: boolean;
    error: string;
    clearable: boolean;
    showPassword: boolean;
    showCount: boolean;
    size: "md" | "sm" | "lg";
}>({ "placeholder": "自定义placeholder", "disabled": false, "readonly": false, "error": "自定义error", "clearable": false, "showPassword": false, "showCount": false, "size": "md" });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>占位文字</span><code>placeholder</code></span><DemoInput v-model="demoConfig.placeholder"/></label>
<label class="demo-field">error<DemoInput v-model="demoConfig.error"/></label>
<label class="demo-field"><span class="demo-control-label"><span>尺寸</span><code>size</code></span><DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><small>只读模式</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><small>允许清空</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showPassword" label="showPassword"/></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showCount" label="showCount"/><small>显示字数</small></div></div></section></div><div class="demo-content"><div class="demo-stack"><HysInput v-bind="demoConfig" v-model="value"  /><HysInput v-model="errorValue" placeholder="输入错误状态" error="请输入正确内容"/><HysInput type="password" placeholder="密码输入框"/><HysInput placeholder="禁用输入框" disabled/></div><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
