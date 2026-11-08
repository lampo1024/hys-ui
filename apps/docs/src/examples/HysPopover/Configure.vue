<script setup lang="ts">
import { HysButton, HysPopover } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput } from 'hys-ui';
const demoConfig = demoReactive<{
    trigger: "click" | "focus" | "hover";
    disabled: boolean;
    title: string;
}>({ "trigger": "click", "disabled": false, "title": "自定义title" });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field">trigger<DemoSelect :model-value="demoConfig.trigger" @update:model-value="demoConfig.trigger=$event as typeof demoConfig.trigger" :options='[{"label":"click","value":"click"},{"label":"focus","value":"focus"},{"label":"hover","value":"hover"}]'/></label>
<label class="demo-field"><span class="demo-control-label"><span>标题</span><code>title</code></span><DemoInput v-model="demoConfig.title"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div></div></section></div><div class="demo-content"><HysPopover v-bind="demoConfig"><template #trigger><HysButton>打开浮层</HysButton></template><p>点击外部或按 Escape 关闭。</p></HysPopover></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
