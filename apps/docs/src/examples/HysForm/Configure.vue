<script setup lang="ts">
import { ref } from 'vue';
import { HysForm, HysFormItem, HysInput, HysButton } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect } from 'hys-ui';
const name = ref('');
const message = ref('');
const demoConfig = demoReactive<{
    loading: boolean;
    disabled: boolean;
    inline: boolean;
    labelPosition: "left" | "right" | "top";
}>({ "loading": false, "disabled": false, "inline": false, "labelPosition": "top" });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>标签位置</span><code>labelPosition</code></span><DemoSelect :model-value="demoConfig.labelPosition" @update:model-value="demoConfig.labelPosition=$event as typeof demoConfig.labelPosition" :options='[{"label":"left","value":"left"},{"label":"right","value":"right"},{"label":"top","value":"top"}]'/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.loading" label="loading"/><small>加载状态</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.inline" label="inline"/></div></div></section></div><div class="demo-content"><HysForm v-bind="demoConfig" :validate="()=>!!name.trim()" @submit="message='校验通过'" @invalid="message='请输入名称'"><HysFormItem label="名称" required :error="message==='请输入名称'?message:undefined"><HysInput v-model="name" placeholder="输入名称"/></HysFormItem><template #actions><HysButton type="submit">提交</HysButton></template></HysForm><output>{{message}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
