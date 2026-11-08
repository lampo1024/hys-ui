<script setup lang="ts">
import { ref } from 'vue';
import { HysResizablePanel } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysNumberInput as DemoNumber } from 'hys-ui';
const toast = ref('');
const panelWidth = ref(300);
const demoConfig = demoReactive<{
    minWidth: number;
    maxWidth: number;
    disabled: boolean;
}>({ "minWidth": 180, "maxWidth": 1200, "disabled": false });
</script>
<template><div><div class="demo-controls"><section class="demo-control-section"><h3>参数设置</h3><div class="demo-control-fields"><label class="demo-field">minWidth<DemoNumber v-model="demoConfig.minWidth" :show-controls="false"/></label>
<label class="demo-field">maxWidth<DemoNumber v-model="demoConfig.maxWidth" :show-controls="false"/></label></div></section><section class="demo-control-section"><h3>状态与行为</h3><div class="demo-control-toggles"><div class="demo-control-toggle"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><small>禁用交互</small></div></div></section></div><div class="demo-content"><section class="ent-gallery-section"><HysResizablePanel v-bind="demoConfig" v-model="panelWidth"><div style="padding:12px">拖拽右边框调整宽度</div></HysResizablePanel></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
