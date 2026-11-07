<script setup lang="ts">
import { ref } from 'vue';
import { HysSplitPane } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysNumberInput as DemoNumber } from 'hys-ui';
const toast = ref('');
const split = ref(40);
const demoConfig = demoReactive<{
    min: number;
    max: number;
    vertical: boolean;
    disabled: boolean;
}>({ "min": 15, "max": 85, "vertical": false, "disabled": false });
</script>
<template><div><div class="demo-controls"><label class="demo-field">min<DemoNumber v-model="demoConfig.min" :show-controls="false"/></label><label class="demo-field">max<DemoNumber v-model="demoConfig.max" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.vertical" label="vertical"/><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/></div><div class="demo-content"><section class="ent-gallery-section"><HysSplitPane v-bind="demoConfig" v-model="split"><template #first><div style="padding:12px">左侧面板 {{split}}%</div></template><template #second><div style="padding:12px">右侧面板</div></template></HysSplitPane></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
