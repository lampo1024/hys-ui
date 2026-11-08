<script setup lang="ts">
import {useHysControlState} from '../../composables/formContext'

import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {computed,ref} from 'vue'
const props=defineProps<{modelValue:string;options:{label:string;value:string;disabled?:boolean}[];disabled?:boolean;block?:boolean;size?:'sm'|'md'|'lg';ariaLabel?:string}>(),emit=defineEmits<{'update:modelValue':[value:string];change:[value:string]}>(),root=ref<HTMLElement>()
const {disabled:controlDisabled,size:controlSize}=useHysControlState(props)

const enabled=computed(()=>props.options.filter(x=>!controlDisabled.value&&!x.disabled)),focusValue=computed(()=>enabled.value.find(x=>x.value===props.modelValue)?.value??enabled.value[0]?.value)
function select(value:string){if(controlDisabled.value||props.options.find(x=>x.value===value)?.disabled)return;const changed=value!==props.modelValue;emit('update:modelValue',value);if(changed)emit('change',value)}
function keyboard(event:KeyboardEvent){if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)||controlDisabled.value)return;const options=props.options.filter(x=>!x.disabled);if(!options.length)return;event.preventDefault();const index=options.findIndex(x=>x.value===props.modelValue),next=options[event.key==='Home'?0:event.key==='End'?options.length-1:index<0?(event.key==='ArrowLeft'?options.length-1:0):(index+(event.key==='ArrowLeft'?-1:1)+options.length)%options.length];select(next.value);Array.from(root.value?.querySelectorAll<HTMLElement>('button')||[]).find(x=>x.dataset.value===next.value)?.focus()}
</script>
<template><div ref="root" v-bind="hysRootAttrs" class="hys-ui-ex-segment" role="radiogroup" :aria-label="ariaLabel||'分段选择'" :style="{display:block?'flex':undefined}" @keydown="keyboard"><button v-for="option in options" :key="option.value" :data-value="option.value" type="button" role="radio" :disabled="controlDisabled||option.disabled" :aria-checked="modelValue===option.value" :tabindex="focusValue===option.value?0:-1" :class="{'hys-ui-active':modelValue===option.value}" :style="{flex:block?1:undefined,padding:controlSize==='sm'?'5px 10px':controlSize==='lg'?'12px 20px':undefined}" @click="select(option.value)"><slot name="label" :option="option">{{option.label}}</slot></button></div></template>
