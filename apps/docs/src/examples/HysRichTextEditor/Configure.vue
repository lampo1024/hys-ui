<script setup lang="ts">
import { ref } from 'vue';
import { HysRichTextEditor } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const toast = ref('');
const html = ref('<p>项目需求描述</p>');
const demoConfig = demoReactive<{
    disabled: boolean;
    readonly: boolean;
    placeholder: string;
    hideToolbar: boolean;
}>({ "disabled": false, "readonly": false, "placeholder": "自定义placeholder", "hideToolbar": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>占位文字</span><code>placeholder</code></span><DemoInput v-model="demoConfig.placeholder"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><small>只读模式</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.hideToolbar" label="hideToolbar"/></div></div></section></div><div class="demo-content"><section class="ent-gallery-section"><HysRichTextEditor v-bind="demoConfig" v-model="html"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
