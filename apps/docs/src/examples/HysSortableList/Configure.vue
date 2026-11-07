<script setup lang="ts">
import { ref } from 'vue';
import { HysSortableList } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const sorted = ref([{ id: 'a', label: '需求评审' }, { id: 'b', label: '技术设计' }, { id: 'c', label: '代码审查' }, { id: 'd', label: '发布上线' }]);
const demoConfig = demoReactive<{
    disabled: boolean;
}>({ "disabled": false });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/></div><div class="demo-content"><section class="card" style="padding:20px"><HysSortableList v-bind="demoConfig" v-model="sorted"/><p class="hint">支持拖拽和上移、下移按钮</p></section></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
