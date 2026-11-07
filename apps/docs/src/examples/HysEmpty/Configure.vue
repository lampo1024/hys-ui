<script setup lang="ts">
import { HysEmpty } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const demoConfig = demoReactive<{
    title: string;
    description: string;
    imageSize: number;
}>({ "title": "暂无数据", "description": "当前没有符合条件的内容", "imageSize": 48 });
</script>
<template><div><div class="demo-controls"><label class="demo-field">title<DemoInput v-model="demoConfig.title"/></label><label class="demo-field">description<DemoInput v-model="demoConfig.description"/></label><label class="demo-field">imageSize<DemoNumber v-model="demoConfig.imageSize" :show-controls="false"/></label></div><div class="demo-content"><HysEmpty v-bind="demoConfig"  /></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
