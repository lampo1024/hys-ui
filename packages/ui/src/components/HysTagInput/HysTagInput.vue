<script setup lang="ts">
import {useHysControlState} from '../../composables/formContext'

import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {ref} from 'vue';import {X} from 'lucide-vue-next'
const props=withDefaults(defineProps<{modelValue:string[];max?:number;placeholder?:string;disabled?:boolean;readonly?:boolean;addOnBlur?:boolean;separator?:string;beforeAdd?:(value:string)=>boolean}>(),{max:10,placeholder:'输入后按 Enter',addOnBlur:true}),emit=defineEmits<{'update:modelValue':[value:string[]];change:[value:string[]];add:[value:string];remove:[value:string];reject:[value:string]}>(),draft=ref('')
const {disabled:controlDisabled}=useHysControlState(props)

function add(){if(controlDisabled.value||props.readonly)return;const input=draft.value.trim();if(!input)return;const candidates=props.separator?input.split(props.separator):[input],next=[...props.modelValue];for(const value of candidates.map(x=>x.trim()).filter(Boolean)){if(next.includes(value)||next.length>=props.max||props.beforeAdd&&props.beforeAdd(value)===false){emit('reject',value);continue}next.push(value);emit('add',value)}emit('update:modelValue',next);emit('change',next);draft.value=''}function remove(index:number){if(controlDisabled.value||props.readonly)return;const value=props.modelValue[index],next=props.modelValue.filter((_,i)=>i!==index);emit('update:modelValue',next);emit('change',next);emit('remove',value)}
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ex-tags" :aria-disabled="controlDisabled"><span v-for="(tag,index) in modelValue" :key="tag" class="hys-ui-ex-tag"><slot name="tag" :value="tag" :index="index">{{tag}}</slot><button v-if="!readonly" type="button" :disabled="controlDisabled" :aria-label="'移除 '+tag" @click="remove(index)"><X :size="14"/></button></span><input v-model="draft" :placeholder="placeholder" aria-label="输入标签" :disabled="controlDisabled||modelValue.length>=max" :readonly="readonly" @keydown.enter="if(!$event.isComposing){$event.preventDefault();add()}" @keydown.backspace="!draft&&modelValue.length&&!$event.isComposing&&remove(modelValue.length-1)" @blur="addOnBlur&&add()"/></div></template>
