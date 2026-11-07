<script setup lang="ts">
import { HysAvatar } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysSelect as DemoSelect, HysNumberInput as DemoNumber } from 'hys-ui';
const demoConfig = demoReactive<{
    size: number;
    shape: "circle" | "square";
    fit: "fill" | "cover" | "contain";
}>({ "size": 36, "shape": "circle", "fit": "cover" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">size<DemoNumber v-model="demoConfig.size" :show-controls="false"/></label><label class="demo-field">shape<DemoSelect :model-value="demoConfig.shape" @update:model-value="demoConfig.shape=$event as typeof demoConfig.shape" :options='[{"label":"circle","value":"circle"},{"label":"square","value":"square"}]'/></label><label class="demo-field">fit<DemoSelect :model-value="demoConfig.fit" @update:model-value="demoConfig.fit=$event as typeof demoConfig.fit" :options='[{"label":"fill","value":"fill"},{"label":"cover","value":"cover"},{"label":"contain","value":"contain"}]'/></label></div><div class="demo-content"><div class="demo-row"><HysAvatar v-bind="demoConfig" name="张明"/><HysAvatar name="Keller" :size="48"/><HysAvatar name="李" :size="32"/></div></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
