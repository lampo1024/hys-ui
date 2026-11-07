<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
defineProps<{modelValue:boolean;label?:string;disabled?:boolean;ariaLabel?:string;readonly?:boolean;name?:string;value?:string;required?:boolean;indeterminate?:boolean}>();const emit=defineEmits<{'update:modelValue':[v:boolean];change:[value:boolean]}>();
</script>
<template><label v-bind="hysRootAttrs" class="hys-ui-check-label"><input type="checkbox" :name="name" :value="value" :required="required" :aria-label="ariaLabel" :indeterminate="indeterminate" :aria-checked="indeterminate?'mixed':modelValue" :checked="modelValue" :disabled="disabled||readonly" @change="emit('update:modelValue',($event.target as HTMLInputElement).checked);emit('change',($event.target as HTMLInputElement).checked)"/><span v-if="label">{{label}}</span><slot/></label></template>
