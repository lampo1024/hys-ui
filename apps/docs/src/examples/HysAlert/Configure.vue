<script setup lang="ts">
import { HysAlert } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput } from 'hys-ui';
const demoConfig = demoReactive<{
    tone: "info" | "success" | "warning" | "danger";
    title: string;
    description: string;
    closable: boolean;
    showIcon: boolean;
    center: boolean;
}>({ "tone": "info", "title": "自定义title", "description": "自定义description", "closable": false, "showIcon": false, "center": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>颜色</span><code>tone</code></span><DemoSelect :model-value="demoConfig.tone" @update:model-value="demoConfig.tone=$event as typeof demoConfig.tone" :options='[{"label":"info","value":"info"},{"label":"success","value":"success"},{"label":"warning","value":"warning"},{"label":"danger","value":"danger"}]'/></label>
<label class="demo-field"><span class="demo-control-label"><span>标题</span><code>title</code></span><DemoInput v-model="demoConfig.title"/></label>
<label class="demo-field"><span class="demo-control-label"><span>描述</span><code>description</code></span><DemoInput v-model="demoConfig.description"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.closable" label="closable"/><small>允许关闭</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showIcon" label="showIcon"/><small>显示图标</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.center" label="center"/></div></div></section></div><div class="demo-content"><HysAlert v-bind="demoConfig"   >更改已保存至本地演示状态。</HysAlert><HysAlert tone="warning" title="注意">请在发布前完成审批。</HysAlert></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
