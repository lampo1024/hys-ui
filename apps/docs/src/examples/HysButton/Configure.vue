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
<template><div><div class="demo-controls"><label class="demo-field">size<DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.loading" label="loading"/><DemoCheckbox v-model="demoConfig.plain" label="plain"/><DemoCheckbox v-model="demoConfig.round" label="round"/><DemoCheckbox v-model="demoConfig.circle" label="circle"/><DemoCheckbox v-model="demoConfig.block" label="block"/><DemoCheckbox v-model="demoConfig.dashed" label="dashed"/><label class="demo-field">iconPosition<DemoSelect :model-value="demoConfig.iconPosition" @update:model-value="demoConfig.iconPosition=$event as typeof demoConfig.iconPosition" :options='[{"label":"left","value":"left"},{"label":"right","value":"right"}]'/></label><label class="demo-field">type<DemoSelect :model-value="demoConfig.type" @update:model-value="demoConfig.type=$event as typeof demoConfig.type" :options='[{"label":"button","value":"button"},{"label":"submit","value":"submit"},{"label":"reset","value":"reset"}]'/></label><label class="demo-field">nativeType<DemoSelect :model-value="demoConfig.nativeType" @update:model-value="demoConfig.nativeType=$event as typeof demoConfig.nativeType" :options='[{"label":"button","value":"button"},{"label":"submit","value":"submit"},{"label":"reset","value":"reset"}]'/></label><DemoCheckbox v-model="demoConfig.autofocus" label="autofocus"/><DemoCheckbox v-model="demoConfig.focusable" label="focusable"/></div><div class="demo-content"><div class="demo-row"><HysButton v-bind="demoConfig" v-for="variant in (['primary','secondary','ghost','danger'] as const)" :key="variant" :variant="variant" @click="message=variant+' 已点击'">{{variant}}</HysButton><HysButton disabled>禁用</HysButton><HysButton loading>加载中</HysButton></div><output aria-live="polite">{{message}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
