<script setup lang="ts" generic="T extends string|number=string">
import {useHysControlState} from '../../composables/formContext'

import { ref, useId } from 'vue'
import { useHysRootAttrs } from '../../config'
export interface HysRadioOption<V extends string|number=string>{label:string;value:V;disabled?:boolean}
const props=withDefaults(defineProps<{modelValue?:T;options:HysRadioOption<T>[];name?:string;disabled?:boolean;readonly?:boolean;required?:boolean;vertical?:boolean;size?:'sm'|'md'|'lg';ariaLabel?:string}>(),{})
const {disabled:controlDisabled,size:controlSize,label:fieldLabel}=useHysControlState(props)

const emit=defineEmits<{'update:modelValue':[value:T];change:[value:T];focus:[event:FocusEvent];blur:[event:FocusEvent]}>()
const hysRootAttrs=useHysRootAttrs(),groupName=useId(),root=ref<HTMLElement>()
function change(option:HysRadioOption<T>){if(controlDisabled.value||props.readonly||option.disabled){root.value?.querySelectorAll<HTMLInputElement>('input').forEach((field,index)=>field.checked=props.options[index]?.value===props.modelValue);return}const changed=option.value!==props.modelValue;emit('update:modelValue',option.value);if(changed)emit('change',option.value)}
function key(event:KeyboardEvent){if(props.readonly&&[' ','Enter','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home','End'].includes(event.key))event.preventDefault()}
defineExpose({focus:()=>{const selected=root.value?.querySelector<HTMLInputElement>('input:checked:not(:disabled)');(selected||root.value?.querySelector<HTMLInputElement>('input:not(:disabled)'))?.focus()}})
</script>
<template><div ref="root" v-bind="hysRootAttrs" class="hys-ui-ex-radio" :class="['hys-ui-radio-'+controlSize,{'hys-ui-radio-disabled':controlDisabled,'hys-ui-radio-readonly':readonly}]" role="radiogroup" :aria-label="ariaLabel||fieldLabel||'单选组'" :aria-disabled="controlDisabled||undefined" :aria-readonly="readonly||undefined" :aria-required="required||undefined" :style="{flexDirection:vertical?'column':undefined}" @keydown="key"><label v-for="option in options" :key="option.value" class="hys-ui-radio-option" :class="{'hys-ui-radio-option-disabled':!controlDisabled&&option.disabled}"><input class="hys-ui-radio-native" type="radio" :name="name||groupName" :value="option.value" :checked="modelValue===option.value" :disabled="controlDisabled||option.disabled" :required="required" @click="readonly&&$event.preventDefault()" @change="change(option)" @focus="emit('focus',$event)" @blur="emit('blur',$event)"/><span class="hys-ui-radio-box" aria-hidden="true"/><span><slot name="label" :option="option">{{option.label}}</slot></span></label></div></template>
<style scoped>
.hys-ui-ex-radio{--hys-ui-radio-size:16px;display:flex;align-items:flex-start;flex-wrap:wrap;gap:12px 20px}.hys-ui-radio-sm{--hys-ui-radio-size:14px;font-size:12px}.hys-ui-radio-lg{--hys-ui-radio-size:18px;font-size:16px}
.hys-ui-radio-option{position:relative;display:inline-flex;align-items:center;gap:8px;cursor:pointer;user-select:none}.hys-ui-radio-native{position:absolute;left:0;top:50%;transform:translateY(-50%);width:var(--hys-ui-radio-size);height:var(--hys-ui-radio-size);margin:0;opacity:0;cursor:inherit;z-index:1}
.hys-ui-radio-box{display:grid;place-items:center;flex:none;width:var(--hys-ui-radio-size);height:var(--hys-ui-radio-size);border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:50%;background:var(--hys-ui-surface,var(--hys-ui-theme-surface));transition:border-color .15s,box-shadow .15s}.hys-ui-radio-box:after{content:'';width:calc(var(--hys-ui-radio-size) - 8px);height:calc(var(--hys-ui-radio-size) - 8px);border-radius:50%;background:var(--hys-ui-primary,var(--hys-ui-theme-primary));transform:scale(0);transition:transform .15s}
.hys-ui-radio-native:checked+.hys-ui-radio-box{border-color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}.hys-ui-radio-native:checked+.hys-ui-radio-box:after{transform:scale(1)}.hys-ui-radio-native:focus-visible+.hys-ui-radio-box{outline:2px solid color-mix(in srgb,var(--hys-ui-primary,var(--hys-ui-theme-primary)) 50%,transparent);outline-offset:2px}.hys-ui-radio-native[aria-invalid=true]+.hys-ui-radio-box{border-color:var(--hys-ui-red,var(--hys-ui-theme-red))}
.hys-ui-radio-disabled,.hys-ui-radio-option-disabled{opacity:.5}.hys-ui-radio-disabled .hys-ui-radio-option,.hys-ui-radio-option-disabled{cursor:not-allowed}.hys-ui-radio-readonly .hys-ui-radio-option{cursor:default}
</style>
