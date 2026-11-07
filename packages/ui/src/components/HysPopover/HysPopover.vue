<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {ref,watch,onBeforeUnmount,onDeactivated} from 'vue';import {useFloating,type Placement} from '../../composables/useFloating'
const props=withDefaults(defineProps<{placement?:Placement;trigger?:'click'|'hover'|'focus';disabled?:boolean;open?:boolean;width?:string;title?:string}>(),{placement:'bottom-end',trigger:'click'}),emit=defineEmits<{'update:open':[value:boolean];visibleChange:[value:boolean]}>(),anchor=ref<HTMLElement>(),panel=ref<HTMLElement>()
const {open,style,show,close,restoringFocus}=useFloating(anchor,panel,{get placement(){return props.placement},gap:8})
let timer:ReturnType<typeof setTimeout>|undefined
function hover(value:boolean){clearTimeout(timer);if(value)request(true);else timer=setTimeout(()=>request(false),100)}
onBeforeUnmount(()=>clearTimeout(timer));onDeactivated(()=>clearTimeout(timer))
function request(value:boolean){if(value&&(props.disabled||restoringFocus.value))return;if(props.open!==undefined){emit('update:open',value);return}value?show():close()}
watch(()=>props.open,value=>{if(value===undefined)return;value&&!props.disabled?show():close()},{immediate:true,flush:'post'});watch(open,value=>{emit('visibleChange',value);if(props.open!==undefined&&props.open!==value)emit('update:open',value)});watch(()=>props.disabled,value=>{if(value)close()})
defineExpose({show:()=>request(true),hide:()=>request(false)})
</script>
<template><span v-bind="hysRootAttrs" class="hys-ui-popover-wrap" @pointerenter="trigger==='hover'&&hover(true)" @pointerleave="trigger==='hover'&&hover(false)"><span ref="anchor" class="hys-ui-popover-trigger" :tabindex="disabled?-1:0" role="button" :aria-disabled="disabled" :aria-expanded="open" aria-haspopup="dialog" @click="trigger==='click'&&request(!open)" @keydown.enter.prevent="request(!open)" @keydown.space.prevent="request(!open)" @focusin="trigger==='focus'&&request(true)" @focusout="trigger==='focus'&&!panel?.contains($event.relatedTarget as Node)&&request(false)"><slot name="trigger"/></span><Teleport to="body"><div v-if="open" ref="panel" v-bind="hysRootAttrs" class="hys-ui-popover-panel hys-ui-floating-surface" :style="{...style,width}" role="dialog" @focusout="trigger==='focus'&&!panel?.contains($event.relatedTarget as Node)&&!anchor?.contains($event.relatedTarget as Node)&&request(false)" :aria-label="title||'浮层'" @pointerenter="trigger==='hover'&&request(true)"><strong v-if="title">{{title}}</strong><slot :close="()=>request(false)"/></div></Teleport></span></template>
<style scoped></style>
