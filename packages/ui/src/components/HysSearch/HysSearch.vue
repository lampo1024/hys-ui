<script setup lang="ts">
import {useHysControlState} from '../../composables/formContext'

import {ref,watch,onBeforeUnmount,onDeactivated} from 'vue'
import {Search,X,LoaderCircle} from 'lucide-vue-next'
import {useHysRootAttrs} from '../../config'
const props=withDefaults(defineProps<{modelValue:string;placeholder?:string;delay?:number;disabled?:boolean;readonly?:boolean;clearable?:boolean;loading?:boolean;ariaLabel?:string}>(),{delay:300,placeholder:'搜索…',clearable:true})
const {disabled:controlDisabled,label:fieldLabel}=useHysControlState(props)

const emit=defineEmits<{'update:modelValue':[value:string];search:[value:string];clear:[];focus:[event:FocusEvent];blur:[event:FocusEvent]}>(),hysRootAttrs=useHysRootAttrs(),input=ref<HTMLInputElement>(),composing=ref(false)
let timer:ReturnType<typeof setTimeout>|undefined,pending:string|undefined
function cancel(){clearTimeout(timer);timer=undefined;pending=undefined}
function search(value:string){cancel();if(!controlDisabled.value)emit('search',value)}
function change(value:string){if(controlDisabled.value||props.readonly||composing.value)return;cancel();pending=value;emit('update:modelValue',value);timer=setTimeout(()=>search(value),Number.isFinite(props.delay)?Math.max(0,props.delay):300)}
watch(()=>[controlDisabled.value,props.readonly],cancel,{flush:'sync'});watch(()=>props.modelValue,value=>{if(pending!==undefined&&value!==pending)cancel()})
onBeforeUnmount(cancel);onDeactivated(cancel)
defineExpose({focus:()=>input.value?.focus(),blur:()=>input.value?.blur()})
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ex-search"><LoaderCircle v-if="loading" class="hys-ui-icon-spin" :size="16"/><Search v-else :size="16" aria-hidden="true"/><input ref="input" type="search" :value="modelValue" :placeholder="placeholder" :disabled="controlDisabled" :readonly="readonly" :aria-label="ariaLabel||fieldLabel||'搜索'" @input="change(($event.target as HTMLInputElement).value)" @compositionstart="composing=true;cancel()" @compositionend="composing=false;change(($event.target as HTMLInputElement).value)" @keydown.enter="!$event.isComposing&&$event.keyCode!==229&&!composing&&search(modelValue)" @focus="emit('focus',$event)" @blur="emit('blur',$event)"/><button v-if="clearable&&modelValue&&!controlDisabled&&!readonly" type="button" aria-label="清空搜索" @click="change('');emit('clear');input?.focus()"><X :size="14"/></button></div></template>
