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
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.searchable" label="searchable"/><DemoCheckbox v-model="demoConfig.checkable" label="checkable"/></div><div class="demo-content"><section class="ent-gallery-section"><HysOrgTree v-bind="demoConfig" v-model="org" :nodes="[{id:'a',name:'研发部'},{id:'b',name:'中台组',parentId:'a'},{id:'c',name:'前端组',parentId:'a'},{id:'d',name:'张工',parentId:'b'}]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
