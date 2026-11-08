<script setup lang="ts">
import HysCheckbox from '../HysCheckbox/HysCheckbox.vue'
import HysSearch from '../HysSearch/HysSearch.vue'
import HysButton from '../HysButton/HysButton.vue'
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import {ref,computed,onDeactivated} from 'vue';import {ChevronLeft,ChevronRight,Search,GripVertical} from 'lucide-vue-next';type Item={label:string;value:string;disabled?:boolean};const props=withDefaults(defineProps<{modelValue:string[];options:Item[];disabled?:boolean;filterable?:boolean;titles?:[string,string]}>(),{filterable:true});const emit=defineEmits<{ 'update:modelValue':[value:string[]];change:[value:string[],direction:'right'|'left',movedKeys:string[]];checkChange:[side:'left'|'right',values:string[]] }>();const left=ref<string[]>([]),right=ref<string[]>([]),query=ref('');const available=computed(()=>props.options.filter(x=>!props.modelValue.includes(x.value)&&x.label.toLowerCase().includes(query.value.toLowerCase())));const selected=computed(()=>props.options.filter(x=>props.modelValue.includes(x.value)));const emptyAvailableKey=Symbol('empty-available'),emptySelectedKey=Symbol('empty-selected')
const dragged=ref<{value:string;fromSelected:boolean}|null>(null)
const dropTarget=ref<boolean|null>(null)
const announcement=ref('')
function move(toRight:boolean,values:string[]=toRight?left.value:right.value) {
 if(props.disabled)return
 const movable=values.filter(value=>props.options.some(item=>item.value===value&&!item.disabled))
 const next=toRight?[...new Set([...props.modelValue,...movable])]:props.modelValue.filter(value=>!movable.includes(value))
 if(next.length!==props.modelValue.length) {
  const moved=movable.filter(value=>toRight?!props.modelValue.includes(value):props.modelValue.includes(value))
  emit('update:modelValue',next)
  emit('change',next,toRight?'right':'left',moved)
  announcement.value=toRight?'已移入已选择区域':'已移回待选择区域'
 }
 left.value=[]
 right.value=[]
}
function check(value:string,toRight:boolean,checked:boolean){if(props.disabled)return;const list=toRight?right:left;list.value=checked?[...list.value,value]:list.value.filter(x=>x!==value);emit('checkChange',toRight?'right':'left',[...list.value])}
function dragStart(event:DragEvent,item:Item,fromSelected:boolean) {
 if(props.disabled || item.disabled || !event.dataTransfer) {event.preventDefault();return}
 dragged.value={value:item.value,fromSelected}
 event.dataTransfer.effectAllowed='move'
 event.dataTransfer.setData('text/plain',item.value)
}
function canDrop(toSelected:boolean) {
 const item=dragged.value
 return !props.disabled && !!item && item.fromSelected!==toSelected &&
  props.modelValue.includes(item.value)===item.fromSelected &&
  props.options.some(option=>option.value===item.value&&!option.disabled)
}
function dragOver(event:DragEvent,toSelected:boolean) {
 if(!canDrop(toSelected)) return
 event.preventDefault()
 if(event.dataTransfer) event.dataTransfer.dropEffect='move'
 dropTarget.value=toSelected
}
function dragLeave(event:DragEvent) {
 if(event.relatedTarget instanceof Node && (event.currentTarget as HTMLElement).contains(event.relatedTarget)) return
 dropTarget.value=null
}
function dragEnd() {dragged.value=null;dropTarget.value=null}
function drop(event:DragEvent,toSelected:boolean) {
 if(!canDrop(toSelected)) {dragEnd();return}
 event.preventDefault()
 move(toSelected,[dragged.value!.value])
 dragEnd()
}
onDeactivated(dragEnd)
</script>
<template>
 <div v-bind="hysRootAttrs" class="hys-ui-v4-transfer hys-ui-pf-transfer">
  <section class="hys-ui-v4-pane" :class="{'hys-ui-is-drop-target':dropTarget===false}" aria-label="待选择" @dragover="dragOver($event,false)" @dragleave="dragLeave" @drop="drop($event,false)">
   <header class="hys-ui-pf-transfer-header"><strong>{{titles?.[0]||'待选择'}}</strong><span>{{available.length}}</span></header>
   <HysSearch v-if="filterable" v-model="query" class="hys-ui-pf-transfer-search" placeholder="筛选成员" aria-label="筛选成员" :disabled="disabled" :delay="0"/>
   <TransitionGroup name="hys-ui-transfer-motion" tag="div" class="hys-ui-pf-transfer-list">
    <HysCheckbox :model-value="left.includes(x.value)" :disabled="disabled||x.disabled" :aria-label="x.label" @change="check(x.value,false,$event)" v-for="x in available" :key="x.value" class="hys-ui-v4-option" :class="{'hys-ui-is-checked':left.includes(x.value),'hys-ui-is-disabled':x.disabled,'hys-ui-is-dragging':dragged?.value===x.value}" :draggable="!disabled&&!x.disabled" :title="x.disabled?undefined:'拖动到已选择区域'" @dragstart="dragStart($event,x,false)" @dragend="dragEnd"><span><slot name="option" :option="x">{{x.label}}</slot></span><GripVertical class="hys-ui-pf-transfer-grip" :size="12" aria-hidden="true"/></HysCheckbox>
    <p v-if="!available.length" :key="emptyAvailableKey" class="hys-ui-pf-transfer-empty">{{query?'无匹配成员':'暂无待选成员'}}</p>
   </TransitionGroup>
  </section>
  <div class="hys-ui-v4-move">
   <HysButton variant="secondary" size="sm" class="hys-ui-v4-control" :disabled="disabled||!left.length" @click="move(true)" aria-label="添加选中项"><ChevronRight :size="16" aria-hidden="true"/></HysButton>
   <HysButton variant="secondary" size="sm" class="hys-ui-v4-control" :disabled="disabled||!right.length" @click="move(false)" aria-label="移除选中项"><ChevronLeft :size="16" aria-hidden="true"/></HysButton>
  </div>
  <section class="hys-ui-v4-pane" :class="{'hys-ui-is-drop-target':dropTarget===true}" aria-label="已选择" @dragover="dragOver($event,true)" @dragleave="dragLeave" @drop="drop($event,true)">
   <header class="hys-ui-pf-transfer-header"><strong>{{titles?.[1]||'已选择'}}</strong><span>{{selected.length}}</span></header>
   <TransitionGroup name="hys-ui-transfer-motion" tag="div" class="hys-ui-pf-transfer-list">
    <HysCheckbox :model-value="right.includes(x.value)" :disabled="disabled||x.disabled" :aria-label="x.label" @change="check(x.value,true,$event)" v-for="x in selected" :key="x.value" class="hys-ui-v4-option" :class="{'hys-ui-is-checked':right.includes(x.value),'hys-ui-is-disabled':x.disabled,'hys-ui-is-dragging':dragged?.value===x.value}" :draggable="!disabled&&!x.disabled" :title="x.disabled?undefined:'拖动到待选择区域'" @dragstart="dragStart($event,x,true)" @dragend="dragEnd"><span><slot name="option" :option="x">{{x.label}}</slot></span><GripVertical class="hys-ui-pf-transfer-grip" :size="12" aria-hidden="true"/></HysCheckbox>
    <p v-if="!selected.length" :key="emptySelectedKey" class="hys-ui-pf-transfer-empty">暂无已选成员</p>
   </TransitionGroup>
  </section>
  <span class="hys-ui-pf-transfer-status" role="status">{{announcement}}</span>
 </div>
</template>
