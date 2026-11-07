<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {useId} from 'vue';const groupName=useId();defineProps<{modelValue:string;options:{label:string;value:string;disabled?:boolean}[];name?:string;disabled?:boolean;vertical?:boolean;ariaLabel?:string}>();const emit=defineEmits<{ 'update:modelValue':[value:string];change:[value:string] }>();
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ex-radio" role="radiogroup" :aria-label="ariaLabel||'单选组'" :style="{flexDirection:vertical?'column':undefined}"><label v-for="o in options" :key="o.value"><input type="radio" :name="name||groupName" :value="o.value" :checked="modelValue===o.value" :disabled="disabled||o.disabled" @change="emit('update:modelValue',o.value);emit('change',o.value)"/> {{o.label}}</label></div></template>
