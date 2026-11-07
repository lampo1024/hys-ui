<script setup lang="ts">
import { ref } from 'vue';
import { HysTagInput } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const tags = ref(['Vue 3', 'TypeScript']);
const demoConfig = demoReactive<{
    max: number;
    placeholder: string;
    disabled: boolean;
    readonly: boolean;
    addOnBlur: boolean;
    separator: string;
}>({ "max": 10, "placeholder": "输入后按 Enter", "disabled": false, "readonly": false, "addOnBlur": true, "separator": "自定义separator" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">max<DemoNumber v-model="demoConfig.max" :show-controls="false"/></label><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><DemoCheckbox v-model="demoConfig.addOnBlur" label="addOnBlur"/><label class="demo-field">separator<DemoInput v-model="demoConfig.separator"/></label></div><div class="demo-content"><HysTagInput v-bind="demoConfig" v-model="tags"/><p class="hint">按 Enter 添加，Backspace 删除</p></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
