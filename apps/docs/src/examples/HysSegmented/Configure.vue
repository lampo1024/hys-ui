<script setup lang="ts">
import { ref } from 'vue';
import { HysSegmented } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect } from 'hys-ui';
const segment = ref('week');
const demoConfig = demoReactive<{
    disabled: boolean;
    block: boolean;
    size: "md" | "sm" | "lg";
}>({ "disabled": false, "block": false, "size": "md" });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.block" label="block"/><label class="demo-field">size<DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div><div class="demo-content"><HysSegmented v-bind="demoConfig" v-model="segment" :options="[{label:'日',value:'day'},{label:'周',value:'week'},{label:'月',value:'month'}]"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
