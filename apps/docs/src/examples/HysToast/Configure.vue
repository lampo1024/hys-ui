<script setup lang="ts">
import { ref } from 'vue';
import { HysButton, HysToast } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysNumberInput as DemoNumber } from 'hys-ui';
const message = ref('');
const type = ref<'success' | 'error' | 'info'>('success');
const demoConfig = demoReactive<{
    type: "info" | "success" | "error";
    duration: number;
    closable: boolean;
    position: "top" | "bottom" | "bottom-right" | "top-right";
}>({ "type": "success", "duration": 3000, "closable": true, "position": "bottom-right" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">type<DemoSelect :model-value="demoConfig.type" @update:model-value="demoConfig.type=$event as typeof demoConfig.type" :options='[{"label":"info","value":"info"},{"label":"success","value":"success"},{"label":"error","value":"error"}]'/></label><label class="demo-field">duration<DemoNumber v-model="demoConfig.duration" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.closable" label="closable"/><label class="demo-field">position<DemoSelect :model-value="demoConfig.position" @update:model-value="demoConfig.position=$event as typeof demoConfig.position" :options='[{"label":"top","value":"top"},{"label":"bottom","value":"bottom"},{"label":"bottom-right","value":"bottom-right"},{"label":"top-right","value":"top-right"}]'/></label></div><div class="demo-content"><div class="demo-row"><HysButton v-for="tone in (['success','error','info'] as const)" :key="tone" @click="type=tone;message='操作反馈 '+tone">{{tone}}</HysButton></div><HysToast v-bind="demoConfig" :message="message"  @close="message=''"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
