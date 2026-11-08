<script setup lang="ts">
import { ref } from 'vue';
import { HysButton } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect } from 'hys-ui';
const message = ref('');
const demoConfig = demoReactive<{
    size: "md" | "sm" | "lg";
    disabled: boolean;
    loading: boolean;
    plain: boolean;
    round: boolean;
    circle: boolean;
    block: boolean;
    dashed: boolean;
    iconPosition: "left" | "right";
    type: "button" | "submit" | "reset";
    nativeType: "button" | "submit" | "reset";
    autofocus: boolean;
    focusable: boolean;
}>({ "size": "md", "disabled": false, "loading": false, "plain": false, "round": false, "circle": false, "block": false, "dashed": false, "iconPosition": "left", "type": "button", "nativeType": "button", "autofocus": false, "focusable": true });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>尺寸</span><code>size</code></span><DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label>
<label class="demo-field"><span class="demo-control-label"><span>图标位置</span><code>iconPosition</code></span><DemoSelect :model-value="demoConfig.iconPosition" @update:model-value="demoConfig.iconPosition=$event as typeof demoConfig.iconPosition" :options='[{"label":"left","value":"left"},{"label":"right","value":"right"}]'/></label>
<label class="demo-field"><span class="demo-control-label"><span>类型</span><code>type</code></span><DemoSelect :model-value="demoConfig.type" @update:model-value="demoConfig.type=$event as typeof demoConfig.type" :options='[{"label":"button","value":"button"},{"label":"submit","value":"submit"},{"label":"reset","value":"reset"}]'/></label>
<label class="demo-field"><span class="demo-control-label"><span>原生按钮类型</span><code>nativeType</code></span><DemoSelect :model-value="demoConfig.nativeType" @update:model-value="demoConfig.nativeType=$event as typeof demoConfig.nativeType" :options='[{"label":"button","value":"button"},{"label":"submit","value":"submit"},{"label":"reset","value":"reset"}]'/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.loading" label="loading"/><small>加载状态</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.plain" label="plain"/><small>浅色样式</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.round" label="round"/><small>圆角外观</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.circle" label="circle"/><small>圆形外观</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.block" label="block"/><small>铺满宽度</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.dashed" label="dashed"/><small>虚线边框</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.autofocus" label="autofocus"/><small>自动聚焦</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.focusable" label="focusable"/><small>允许聚焦</small></div></div></section></div><div class="demo-content"><div class="demo-row"><HysButton v-bind="demoConfig" v-for="variant in (['primary','secondary','ghost','danger'] as const)" :key="variant" :variant="variant" @click="message=variant+' 已点击'">{{variant}}</HysButton><HysButton disabled>禁用</HysButton><HysButton loading>加载中</HysButton></div><output aria-live="polite">{{message}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
