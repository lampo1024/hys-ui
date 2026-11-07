<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {computed,ref,useId} from 'vue';import {ChevronDown} from 'lucide-vue-next'
const props=defineProps<{items:{title:string;content?:string;disabled?:boolean}[];multiple?:boolean;modelValue?:number[];defaultActive?:number[];disabled?:boolean}>(),emit=defineEmits<{'update:modelValue':[value:number[]];change:[value:number[]]}>(),local=ref(props.defaultActive||[]),open=computed(()=>props.modelValue??local.value),id=useId()
function toggle(index:number){if(props.disabled||props.items[index]?.disabled)return;const next=open.value.includes(index)?open.value.filter(x=>x!==index):props.multiple?[...open.value,index]:[index];local.value=next;emit('update:modelValue',next);emit('change',next)}
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ex-accordion"><section v-for="(item,index) in items" :key="index"><h3><button :id="id+'-button-'+index" type="button" :disabled="disabled||item.disabled" :aria-expanded="open.includes(index)" :aria-controls="id+'-panel-'+index" @click="toggle(index)"><slot name="title" :item="item" :index="index">{{item.title}}</slot><ChevronDown :size="16" class="hys-ui-accordion-chevron"/></button></h3><div v-if="open.includes(index)" :id="id+'-panel-'+index" role="region" :aria-labelledby="id+'-button-'+index" class="hys-ui-ex-accordion-body"><slot name="content" :item="item" :index="index">{{item.content}}</slot></div></section></div></template>
<style scoped>.hys-ui-accordion-chevron{transition:transform .15s}[aria-expanded=true] .hys-ui-accordion-chevron{transform:rotate(180deg)}</style>
