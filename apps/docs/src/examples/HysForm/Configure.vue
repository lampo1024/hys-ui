<script setup lang="ts">
import { ref } from 'vue';
import { HysForm, HysFormItem, HysInput, HysButton } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect } from 'hys-ui';
const name = ref('');
const message = ref('');
const demoConfig = demoReactive<{
    loading: boolean;
    disabled: boolean;
    inline: boolean;
    labelPosition: "left" | "right" | "top";
}>({ "loading": false, "disabled": false, "inline": false, "labelPosition": "top" });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.loading" label="loading"/><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.inline" label="inline"/><label class="demo-field">labelPosition<DemoSelect :model-value="demoConfig.labelPosition" @update:model-value="demoConfig.labelPosition=$event as typeof demoConfig.labelPosition" :options='[{"label":"left","value":"left"},{"label":"right","value":"right"},{"label":"top","value":"top"}]'/></label></div><div class="demo-content"><HysForm v-bind="demoConfig" :validate="()=>!!name.trim()" @submit="message='校验通过'" @invalid="message='请输入名称'"><HysFormItem label="名称" required :error="message==='请输入名称'?message:undefined"><HysInput v-model="name" placeholder="输入名称"/></HysFormItem><template #actions><HysButton type="submit">提交</HysButton></template></HysForm><output>{{message}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
