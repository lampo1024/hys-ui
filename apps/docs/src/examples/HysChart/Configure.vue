<script setup lang="ts">
import { ref } from 'vue';
import { HysChart } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysSelect as DemoSelect, HysNumberInput as DemoNumber } from 'hys-ui';
const toast = ref('');
const demoConfig = demoReactive<{
    type: "bar" | "line";
    height: number;
}>({ "type": "bar", "height": 220 });
</script>
<template><div><div class="demo-controls"><label class="demo-field">type<DemoSelect :model-value="demoConfig.type" @update:model-value="demoConfig.type=$event as typeof demoConfig.type" :options='[{"label":"bar","value":"bar"},{"label":"line","value":"line"}]'/></label><label class="demo-field">height<DemoNumber v-model="demoConfig.height" :show-controls="false"/></label></div><div class="demo-content"><section class="ent-gallery-section"><HysChart v-bind="demoConfig" :data="[{label:'一月',value:23},{label:'二月',value:52},{label:'三月',value:41}]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
