<script setup lang="ts">
import { ref } from 'vue';
import { HysRichTextEditor } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysInput as DemoInput } from 'hys-ui';
const toast = ref('');
const html = ref('<p>项目需求描述</p>');
const demoConfig = demoReactive<{
    disabled: boolean;
    readonly: boolean;
    placeholder: string;
    hideToolbar: boolean;
}>({ "disabled": false, "readonly": false, "placeholder": "自定义placeholder", "hideToolbar": false });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><label class="demo-field">placeholder<DemoInput v-model="demoConfig.placeholder"/></label><DemoCheckbox v-model="demoConfig.hideToolbar" label="hideToolbar"/></div><div class="demo-content"><section class="ent-gallery-section"><HysRichTextEditor v-bind="demoConfig" v-model="html"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
