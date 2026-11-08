<script setup lang="ts">
import { ref } from 'vue';
import { HysOrgTree } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const toast = ref('');
const org = ref('a');
const demoConfig = demoReactive<{
    searchable: boolean;
    checkable: boolean;
}>({ "searchable": false, "checkable": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.searchable" label="searchable"/><small>显示搜索</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.checkable" label="checkable"/><small>显示复选框</small></div></div></section></div><div class="demo-content"><section class="ent-gallery-section"><HysOrgTree v-bind="demoConfig" v-model="org" :nodes="[{id:'a',name:'研发部'},{id:'b',name:'中台组',parentId:'a'},{id:'c',name:'前端组',parentId:'a'},{id:'d',name:'张工',parentId:'b'}]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
