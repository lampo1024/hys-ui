<script setup lang="ts">
import { ref } from 'vue';
import { HysSelect } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput } from 'hys-ui';
const events = ref('');
;
const value = ref('');
const select = ref('blue');
const demoConfig = demoReactive<{
    disabled: boolean;
    placeholder: string;
    filterable: boolean;
    clearable: boolean;
    loading: boolean;
    remote: boolean;
    emptyText: string;
    size: "md" | "sm" | "lg";
}>({ "disabled": false, "placeholder": "请选择", "filterable": false, "clearable": false, "loading": false, "remote": false, "emptyText": "暂无选项", "size": "md" });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label><DemoCheckbox v-model="demoConfig.filterable" label="filterable"/><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><DemoCheckbox v-model="demoConfig.loading" label="loading"/><DemoCheckbox v-model="demoConfig.remote" label="remote"/><label class="demo-field">emptyText<DemoInput v-model="demoConfig.emptyText"/></label><label class="demo-field">size<DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div><div class="demo-content"><div class="demo-stack"><HysSelect v-bind="demoConfig" v-model="select" :options="[{label:'科技蓝',value:'blue'},{label:'清新绿',value:'green'},{label:'紫色极简',value:'purple'}]"/><HysSelect v-model="select" :options="[{label:'选项 A',value:'a'}]" disabled/></div><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
