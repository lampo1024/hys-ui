<script setup lang="ts">
import { HysFormItem, HysInput } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const demoConfig = demoReactive<{
    label: string;
    error: string;
    required: boolean;
    hint: string;
}>({ "label": "自定义label", "error": "自定义error", "required": false, "hint": "自定义hint" });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label>
<label class="demo-field">error<DemoInput v-model="demoConfig.error"/></label>
<label class="demo-field">hint<DemoInput v-model="demoConfig.hint"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.required" label="required"/><small>必填</small></div></div></section></div><div class="demo-content"><HysFormItem v-bind="demoConfig"   ><HysInput placeholder="负责人"/></HysFormItem><HysFormItem label="校验错误" error="此项不能为空"><HysInput/></HysFormItem></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
