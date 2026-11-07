<script setup lang="ts">
import { ref } from 'vue';
import { HysBadge } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysNumberInput as DemoNumber } from 'hys-ui';
const events = ref('');
;
const demoConfig = demoReactive<{
    tone: "blue" | "green" | "orange" | "red" | "purple" | "gray";
    size: "md" | "sm";
    round: boolean;
    closable: boolean;
    dot: boolean;
    max: number;
    showZero: boolean;
}>({ "tone": "blue", "size": "md", "round": false, "closable": false, "dot": false, "max": 99, "showZero": false });
</script>
<template><div><div class="demo-controls"><label class="demo-field">tone<DemoSelect :model-value="demoConfig.tone" @update:model-value="demoConfig.tone=$event as typeof demoConfig.tone" :options='[{"label":"blue","value":"blue"},{"label":"green","value":"green"},{"label":"orange","value":"orange"},{"label":"red","value":"red"},{"label":"purple","value":"purple"},{"label":"gray","value":"gray"}]'/></label><label class="demo-field">size<DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"}]'/></label><DemoCheckbox v-model="demoConfig.round" label="round"/><DemoCheckbox v-model="demoConfig.closable" label="closable"/><DemoCheckbox v-model="demoConfig.dot" label="dot"/><label class="demo-field">max<DemoNumber v-model="demoConfig.max" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.showZero" label="showZero"/></div><div class="demo-content"><div class="demo-row"><HysBadge v-bind="demoConfig" >进行中</HysBadge><HysBadge tone="green">已完成</HysBadge><HysBadge tone="orange">待处理</HysBadge><HysBadge tone="red">风险</HysBadge><HysBadge tone="purple">评审中</HysBadge><HysBadge tone="gray">已关闭</HysBadge></div><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
