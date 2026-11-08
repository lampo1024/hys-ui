<script setup lang="ts">
import {useHysControlState} from '../../composables/formContext'

import { ref, useAttrs } from 'vue'
import { Check, Minus } from 'lucide-vue-next'
import { useHysRootAttrs } from '../../config'
defineOptions({ inheritAttrs: false })
const props = withDefaults(defineProps<{ modelValue:boolean; label?:string; disabled?:boolean; ariaLabel?:string; readonly?:boolean; name?:string; value?:string; required?:boolean; indeterminate?:boolean; tabindex?:number; size?:'sm'|'md'|'lg' }>(),{})
const {disabled:controlDisabled,size:controlSize}=useHysControlState(props)

const emit = defineEmits<{ 'update:modelValue':[value:boolean]; change:[value:boolean];focus:[event:FocusEvent];blur:[event:FocusEvent] }>()
const hysRootAttrs=useHysRootAttrs(),input=ref<HTMLInputElement>(),attrs=useAttrs()
const nativeKey=(key:string)=>key==='id'||key==='form'||key==='autofocus'||key.startsWith('aria-')
const rootAttrs=()=>Object.fromEntries(Object.entries(attrs).filter(([key])=>!nativeKey(key)))
const nativeAttrs=()=>Object.fromEntries(Object.entries(attrs).filter(([key])=>nativeKey(key)))
function change(event:Event){const field=event.target as HTMLInputElement;if(controlDisabled.value||props.readonly){field.checked=props.modelValue;field.indeterminate=!!props.indeterminate;return}const value=field.checked;emit('update:modelValue',value);emit('change',value)}
defineExpose({input,focus:()=>input.value?.focus(),blur:()=>input.value?.blur()})
</script>
<template>
  <label v-bind="{...hysRootAttrs,...rootAttrs()}" class="hys-ui-check-label" :class="['hys-ui-checkbox-'+controlSize,{'hys-ui-checkbox-disabled':controlDisabled,'hys-ui-checkbox-readonly':readonly}]">
    <input ref="input" v-bind="nativeAttrs()" class="hys-ui-checkbox-native" type="checkbox" :name="name" :value="value" :required="required" :aria-label="ariaLabel" :aria-readonly="readonly||undefined" :indeterminate="indeterminate" :aria-checked="indeterminate?'mixed':modelValue" :checked="modelValue" :disabled="controlDisabled" :tabindex="tabindex" @click="readonly&&$event.preventDefault()" @change="change" @focus="emit('focus',$event)" @blur="emit('blur',$event)"/>
    <span class="hys-ui-checkbox-box" :class="{'hys-ui-checkbox-checked':modelValue||indeterminate}" aria-hidden="true"><slot name="icon" :checked="modelValue" :indeterminate="indeterminate"><component :is="indeterminate?Minus:Check" v-if="modelValue||indeterminate" :size="controlSize==='sm'?11:controlSize==='lg'?15:13" :stroke-width="2.4"/></slot></span>
    <span v-if="label" class="hys-ui-checkbox-label">{{label}}</span><slot/>
  </label>
</template>
<style scoped>
.hys-ui-check-label{--hys-ui-checkbox-size:16px;position:relative;display:inline-flex;align-items:center;gap:8px;min-width:0;cursor:pointer;user-select:none;font-weight:400;line-height:1.5}
.hys-ui-checkbox-sm{--hys-ui-checkbox-size:14px;font-size:12px}.hys-ui-checkbox-lg{--hys-ui-checkbox-size:18px;font-size:16px}
.hys-ui-checkbox-native{position:absolute;left:0;top:50%;transform:translateY(-50%);width:var(--hys-ui-checkbox-size);height:var(--hys-ui-checkbox-size);margin:0;opacity:0;cursor:inherit;z-index:1}
.hys-ui-checkbox-box{display:inline-grid;place-items:center;flex:none;width:var(--hys-ui-checkbox-size);height:var(--hys-ui-checkbox-size);border:1px solid var(--hys-ui-border,var(--hys-ui-theme-border));border-radius:4px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface));color:#fff;transition:background-color .15s,border-color .15s,box-shadow .15s}
.hys-ui-checkbox-box.hys-ui-checkbox-checked{background:var(--hys-ui-primary,var(--hys-ui-theme-primary));border-color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}
.hys-ui-check-label:not(.hys-ui-checkbox-disabled):not(.hys-ui-checkbox-readonly):hover .hys-ui-checkbox-box{border-color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}
.hys-ui-checkbox-native:focus-visible+.hys-ui-checkbox-box{outline:2px solid color-mix(in srgb,var(--hys-ui-primary,var(--hys-ui-theme-primary)) 50%,transparent);outline-offset:2px}
.hys-ui-checkbox-native[aria-invalid=true]+.hys-ui-checkbox-box{border-color:var(--hys-ui-red,var(--hys-ui-theme-red))}
.hys-ui-checkbox-disabled{opacity:.5;cursor:not-allowed}.hys-ui-checkbox-readonly{cursor:default}.hys-ui-checkbox-label{min-width:0}
</style>
