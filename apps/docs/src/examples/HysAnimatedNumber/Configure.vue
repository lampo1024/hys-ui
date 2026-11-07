<script setup lang="ts">
import { ref } from 'vue';
import { HysAnimatedNumber, HysButton } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysNumberInput as DemoNumber } from 'hys-ui';
const value = ref(128);
const demoConfig = demoReactive<{
    duration: number;
    decimals: number;
}>({ "duration": 650, "decimals": 0 });
</script>
<template><div><div class="demo-controls"><label class="demo-field">duration<DemoNumber v-model="demoConfig.duration" :show-controls="false"/></label><label class="demo-field">decimals<DemoNumber v-model="demoConfig.decimals" :show-controls="false"/></label></div><div class="demo-content"><HysAnimatedNumber v-bind="demoConfig" :value="value" /><HysButton @click="value+=37.5">增加数值</HysButton></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
