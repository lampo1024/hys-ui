<script setup lang="ts">
import { ref } from 'vue';
import { HysUpload } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const events = ref('');
;
const demoConfig = demoReactive<{
    disabled: boolean;
    drag: boolean;
    showFileList: boolean;
}>({ "disabled": false, "drag": true, "showFileList": true });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.drag" label="drag"/><small>允许拖入文件</small></div>
<div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.showFileList" label="showFileList"/><small>显示文件列表</small></div></div></section></div><div class="demo-content"><HysUpload v-bind="demoConfig"/><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
