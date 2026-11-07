<script setup lang="ts">
import { ref } from 'vue';
import { HysNumberInput } from 'hys-ui';
import { reactive as demoReactive } from 'vue';
import { HysCheckbox as DemoCheckbox, HysSelect as DemoSelect, HysNumberInput as DemoNumber } from 'hys-ui';
const num = ref(3);
const demoConfig = demoReactive<{
    step: number;
    stepStrictly: boolean;
    disabled: boolean;
    readonly: boolean;
    showControls: boolean;
    selectOnFocus: boolean;
    size: "md" | "sm" | "lg";
}>({ "step": 1, "stepStrictly": false, "disabled": false, "readonly": false, "showControls": true, "selectOnFocus": false, "size": "md" });
</script>
<template><div><div class="demo-controls"><label class="demo-field">step<DemoNumber v-model="demoConfig.step" :show-controls="false"/></label><DemoCheckbox v-model="demoConfig.stepStrictly" label="stepStrictly"/><DemoCheckbox v-model="demoConfig.disabled" label="disabled"/><DemoCheckbox v-model="demoConfig.readonly" label="readonly"/><DemoCheckbox v-model="demoConfig.showControls" label="showControls"/><DemoCheckbox v-model="demoConfig.selectOnFocus" label="selectOnFocus"/><label class="demo-field">size<DemoSelect :model-value="demoConfig.size" @update:model-value="demoConfig.size=$event as typeof demoConfig.size" :options='[{"label":"md","value":"md"},{"label":"sm","value":"sm"},{"label":"lg","value":"lg"}]'/></label></div><div class="demo-content"><div class="demo-stack"><HysNumberInput v-bind="demoConfig" v-model="num" :min="0" :max="20"/><HysNumberInput v-model="num" :min="0" :max="20" :show-controls="false" aria-label="无加减按钮的数值"/><small class="muted">可通过 showControls 切换加减按钮显示</small></div></div><pre class="state-output">{{JSON.stringify(demoConfig,null,2)}}</pre></div></template>
