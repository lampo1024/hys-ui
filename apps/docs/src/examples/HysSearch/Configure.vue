<script setup lang="ts">
import { ref } from 'vue';
import { HysSearch } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput, HysNumberInput as DemoNumber } from 'hys-ui';
const search = ref('');
const demoConfig = demoReactive<{
    placeholder: string;
    delay: number;
    disabled: boolean;
    readonly: boolean;
    clearable: boolean;
    loading: boolean;
}>({ "placeholder": "搜索…", "delay": 300, "disabled": false, "readonly": false, "clearable": true, "loading": false });
</script>
<template><div><div class="demo-controls"><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label><label class="demo-field">delay<DemoNumber v-model="demoConfig.delay" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><DemoCheckbox v-model="demoConfig.loading" label="loading"/></div><div class="demo-content"><HysSearch v-bind="demoConfig" v-model="search" /><p class="hint">关键词：{{search||'无'}}</p></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
