<script setup lang="ts">
import { ref } from 'vue';
import { HysTour, HysButton } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const toast = ref('');
const tour = ref(false);
const demoConfig = demoReactive<{
    closeOnEscape: boolean;
}>({ "closeOnEscape": false });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.closeOnEscape" label="closeOnEscape"/></div><div class="demo-content"><section class="ent-gallery-section"><div class="demo-panel"><HysButton variant="secondary" @click="tour=true">开始新手引导</HysButton><HysTour v-bind="demoConfig" v-model="tour" :steps="[{title:'欢迎',description:'这是第一步'},{title:'项目管理',description:'这里可管理项目和任务'}]"/></div></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
