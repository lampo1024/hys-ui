<script setup lang="ts">
import { HysCard, HysButton } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysInput as DemoInput } from 'hys-ui';
const demoConfig = demoReactive<{
    title: string;
    loading: boolean;
    bordered: boolean;
    shadow: "always" | "hover" | "never";
    size: "md" | "sm" | "lg";
}>({ "title": "自定义title", "loading": false, "bordered": false, "shadow": "always", "size": "md" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">title<DemoInput v-model="demoConfig.title"/></label><DemoCheckbox v-model="demoConfig.loading" label="loading"/><DemoCheckbox v-model="demoConfig.bordered" label="bordered"/><label class="demo-field">shadow<DemoSelect :model-value="demoConfig.shadow" @update:model-value="demoConfig.shadow=$event as typeof demoConfig.shadow" :options='[{"label":"always","value":"always"},{"label":"hover","value":"hover"},{"label":"never","value":"never"}]'/></label><label class="demo-field">size<DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div><div class="demo-content"><HysCard v-bind="demoConfig" ><template #action><HysButton variant="ghost">操作</HysButton></template><p>卡片内容与操作区域可自定义。</p></HysCard></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
