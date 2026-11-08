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
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field"><span class="demo-control-label"><span>持续时间</span><code>duration</code></span><DemoNumber v-model="demoConfig.duration" :show-controls="false"/></label>
<label class="demo-field">decimals<DemoNumber v-model="demoConfig.decimals" :show-controls="false"/></label></div></section></div><div class="demo-content"><HysAnimatedNumber v-bind="demoConfig" :value="value" /><HysButton @click="value+=37.5">增加数值</HysButton></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
