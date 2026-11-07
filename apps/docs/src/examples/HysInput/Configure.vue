<script setup lang="ts">
import { ref } from 'vue';
import { HysInput } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput } from 'hys-ui';
const events = ref('');
;
const value = ref('');
const errorValue = ref('');
const demoConfig = demoReactive<{
    placeholder: string;
    disabled: boolean;
    readonly: boolean;
    error: string;
    clearable: boolean;
    showPassword: boolean;
    showCount: boolean;
    size: "md" | "sm" | "lg";
}>({ "placeholder": "自定义placeholder", "disabled": false, "readonly": false, "error": "自定义error", "clearable": false, "showPassword": false, "showCount": false, "size": "md" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><label class="demo-field">error<DemoInput v-model="demoConfig.error"/></label><DemoCheckbox v-model="demoConfig.clearable" label="clearable"/><DemoCheckbox v-model="demoConfig.showPassword" label="showPassword"/><DemoCheckbox v-model="demoConfig.showCount" label="showCount"/><label class="demo-field">size<DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div><div class="demo-content"><div class="demo-stack"><HysInput v-bind="demoConfig" v-model="value"  /><HysInput v-model="errorValue" placeholder="输入错误状态" error="请输入正确内容"/><HysInput type="password" placeholder="密码输入框"/><HysInput placeholder="禁用输入框" disabled/></div><output v-if="events" aria-live="polite">{{events}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
