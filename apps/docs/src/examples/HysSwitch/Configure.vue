<script setup lang="ts">
import { ref } from 'vue';
import { HysSwitch } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const value = ref(true);
const demoConfig = demoReactive<{
    disabled: boolean;
    loading: boolean;
}>({ "disabled": false, "loading": false });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.loading" label="loading"/></div><div class="demo-content"><HysSwitch v-bind="demoConfig" v-model="value"/><output>开启：{{value}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
