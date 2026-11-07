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
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.drag" label="drag"/><DemoCheckbox v-model="demoConfig.showFileList" label="showFileList"/></div><div class="demo-content"><HysUpload v-bind="demoConfig"/><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
