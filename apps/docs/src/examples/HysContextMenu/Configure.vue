<script setup lang="ts">
import { ref } from 'vue';
import { HysContextMenu } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox } from 'hys-ui';
const toast = ref('');
const demoConfig = demoReactive<{
    disabled: boolean;
}>({ "disabled": false });
</script>
<template><div><div class="demo-controls"><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/></div><div class="demo-content"><section class="ent-gallery-section"><HysContextMenu v-bind="demoConfig" :items="[{label:'查看',value:'open'},{label:'复制',value:'copy'}]" @select="toast='菜单: '+$event"><div class="demo-panel">在这里点击右键打开菜单</div></HysContextMenu></section><output v-if="toast" aria-live="polite">{{toast}}</output></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
