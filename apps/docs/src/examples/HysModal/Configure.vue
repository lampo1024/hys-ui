<script setup lang="ts">
import { ref } from 'vue';
import { HysButton, HysModal } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect } from 'hys-ui';
const open = ref(false);
const demoConfig = demoReactive<{
    closeOnMask: boolean;
    closeOnEscape: boolean;
    showClose: boolean;
    destroyOnClose: boolean;
    fullscreen: boolean;
    placement: "left" | "right" | "top" | "bottom";
}>({ "closeOnMask": true, "closeOnEscape": true, "showClose": true, "destroyOnClose": true, "fullscreen": false, "placement": "right" });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.closeOnMask" label="closeOnMask"/><DemoCheckbox v-model="demoConfig.closeOnEscape" label="closeOnEscape"/><DemoCheckbox v-model="demoConfig.showClose" label="showClose"/><DemoCheckbox v-model="demoConfig.destroyOnClose" label="destroyOnClose"/><DemoCheckbox v-model="demoConfig.fullscreen" label="fullscreen"/><label class="demo-field">placement<DemoSelect :model-value="demoConfig.placement" @update:model-value="demoConfig.placement=$event as typeof demoConfig.placement" :options='[{"label":"left","value":"left"},{"label":"right","value":"right"},{"label":"top","value":"top"},{"label":"bottom","value":"bottom"}]'/></label></div><div class="demo-content"><HysButton @click="open=true">打开弹窗</HysButton><HysModal v-bind="demoConfig" :open="open" title="操作确认" @close="open=false"><p>支持遮罩、Escape、焦点管理和底部插槽。</p><template #footer><HysButton @click="open=false">确认</HysButton></template></HysModal></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
