<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { HysBreadcrumb } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysInput as DemoInput } from 'hys-ui';
const demoConfig = demoReactive<{
    separator: string;
}>({ "separator": "自定义separator" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">separator<DemoInput v-model="demoConfig.separator"/></label></div><div class="demo-content"><HysBreadcrumb v-bind="demoConfig" :items="[{label:'组件文档',href:'/'},{label:'面包屑'}]"><template #link="{item}"><RouterLink :to="item.href!">{{item.label}}</RouterLink></template></HysBreadcrumb></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
