<script setup lang="ts">
import { ref } from 'vue';
import { HysTextarea } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const text = ref('');
const demoConfig = demoReactive<{
    label: string;
    placeholder: string;
    rows: number;
    disabled: boolean;
    readonly: boolean;
    error: string;
    showCount: boolean;
    resize: "horizontal" | "vertical" | "none" | "both";
}>({ "label": "自定义label", "placeholder": "自定义placeholder", "rows": 4, "disabled": false, "readonly": false, "error": "自定义error", "showCount": true, "resize": "vertical" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">label<DemoInput v-model="demoConfig.label"/></label><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label><label class="demo-field">rows<DemoNumber v-model="demoConfig.rows" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><label class="demo-field">error<DemoInput v-model="demoConfig.error"/></label><DemoCheckbox v-model="demoConfig.showCount" label="showCount"/><label class="demo-field">resize<DemoSelect :model-value="demoConfig.resize" @update:model-value="demoConfig.resize=$event as typeof demoConfig.resize" :options='[{"label":"horizontal","value":"horizontal"},{"label":"vertical","value":"vertical"},{"label":"none","value":"none"},{"label":"both","value":"both"}]'/></label></div><div class="demo-content"><HysTextarea v-bind="demoConfig" v-model="text"   :maxlength="200"/></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
