<script setup lang="ts">
import { ref } from 'vue';
import { HysSearch } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const search = ref('');
const demoConfig = demoReactive<{
    placeholder: string;
    delay: number;
    disabled: boolean;
    readonly: boolean;
    clearable: boolean;
    loading: boolean;
}>({ "placeholder": "搜索…", "delay": 300, "disabled": false, "readonly": false, "clearable": true, "loading": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>占位文字</span><code>placeholder</code></span><DemoInput v-model="demoConfig.placeholder"/></label>
<label class="demo-field">delay<DemoNumber v-model="demoConfig.delay" :show-controls="false"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><small>只读模式</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><small>允许清空</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.loading" label="loading"/><small>加载状态</small></div></div></section></div><div class="demo-content"><HysSearch v-bind="demoConfig" v-model="search" /><p class="hint">关键词：{{search||'无'}}</p></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
