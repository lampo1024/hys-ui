<script setup lang="ts">
import { ref } from 'vue';
import { HysRating } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysNumberInput as DemoNumber } from 'hys-ui';
const rating = ref(4);
const demoConfig = demoReactive<{
    max: number;
    readonly: boolean;
    disabled: boolean;
    allowClear: boolean;
    allowHalf: boolean;
    showScore: boolean;
}>({ "max": 5, "readonly": false, "disabled": false, "allowClear": true, "allowHalf": false, "showScore": false });
</script>
<template><div><div class="demo-controls"><label class="demo-field">max<DemoNumber v-model="demoConfig.max" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.allowClear" label="allowClear"/><DemoCheckbox v-model="demoConfig.allowHalf" label="allowHalf"/><DemoCheckbox v-model="demoConfig.showScore" label="showScore"/></div><div class="demo-content"><HysRating v-bind="demoConfig" v-model="rating"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
