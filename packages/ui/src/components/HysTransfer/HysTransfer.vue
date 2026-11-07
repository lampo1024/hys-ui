<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import {ref,computed,onDeactivated} from 'vue';import {ChevronLeft,ChevronRight,Search,GripVertical} from 'lucide-vue-next';type Item={label:string;value:string;disabled?:boolean};const props=defineProps<{modelValue:string[];options:Item[];disabled?:boolean;filterable?:boolean;titles?:[string,string]}>();const emit=defineEmits<{ 'update:modelValue':[value:string[]] }>();const left=ref<string[]>([]),right=ref<string[]>([]),query=ref('');const available=computed(()=>props.options.filter(x=>!props.modelValue.includes(x.value)&&x.label.toLowerCase().includes(query.value.toLowerCase())));const selected=computed(()=>props.options.filter(x=>props.modelValue.includes(x.value)));const emptyAvailableKey=Symbol('empty-available'),emptySelectedKey=Symbol('empty-selected')
const dragged=ref<{value:string;fromSelected:boolean}|null>(null)
const dropTarget=ref<boolean|null>(null)
const announcement=ref('')
function move(toRight:boolean,values:string[]=toRight?left.value:right.value) {
 if(props.disabled)return
 const movable=values.filter(value=>props.options.some(item=>item.value===value&&!item.disabled))
 const next=toRight?[...new Set([...props.modelValue,...movable])]:props.modelValue.filter(value=>!movable.includes(value))
 if(next.length!==props.modelValue.length) {
  emit('update:modelValue',next)
  announcement.value=toRight?'已移入已选择区域':'已移回待选择区域'
 }
 left.value=[]
 right.value=[]
}
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
   <div v-if="filterable!==false" class="hys-ui-pf-transfer-search"><Search :size="14" aria-hidden="true"/><input v-model="query" placeholder="筛选成员" aria-label="筛选成员"/></div>
   <TransitionGroup name="hys-ui-transfer-motion" tag="div" class="hys-ui-pf-transfer-list">
    <label v-for="x in available" :key="x.value" class="hys-ui-v4-option" :class="{'hys-ui-is-checked':left.includes(x.value),'hys-ui-is-disabled':x.disabled,'hys-ui-is-dragging':dragged?.value===x.value}" :draggable="!disabled&&!x.disabled" :title="x.disabled?undefined:'拖动到已选择区域'" @dragstart="dragStart($event,x,false)" @dragend="dragEnd"><input v-model="left" type="checkbox" :value="x.value" :disabled="disabled||x.disabled"/><span><slot name="option" :option="x">{{x.label}}</slot></span><GripVertical class="hys-ui-pf-transfer-grip" :size="12" aria-hidden="true"/></label>
    <p v-if="!available.length" :key="emptyAvailableKey" class="hys-ui-pf-transfer-empty">{{query?'无匹配成员':'暂无待选成员'}}</p>
   </TransitionGroup>
  </section>
  <div class="hys-ui-v4-move">
   <button type="button" class="hys-ui-v4-control" :disabled="disabled||!left.length" @click="move(true)" aria-label="添加选中项"><ChevronRight :size="16" aria-hidden="true"/></button>
   <button type="button" class="hys-ui-v4-control" :disabled="disabled||!right.length" @click="move(false)" aria-label="移除选中项"><ChevronLeft :size="16" aria-hidden="true"/></button>
  </div>
  <section class="hys-ui-v4-pane" :class="{'hys-ui-is-drop-target':dropTarget===true}" aria-label="已选择" @dragover="dragOver($event,true)" @dragleave="dragLeave" @drop="drop($event,true)">
   <header class="hys-ui-pf-transfer-header"><strong>{{titles?.[1]||'已选择'}}</strong><span>{{selected.length}}</span></header>
   <TransitionGroup name="hys-ui-transfer-motion" tag="div" class="hys-ui-pf-transfer-list">
    <label v-for="x in selected" :key="x.value" class="hys-ui-v4-option" :class="{'hys-ui-is-checked':right.includes(x.value),'hys-ui-is-disabled':x.disabled,'hys-ui-is-dragging':dragged?.value===x.value}" :draggable="!x.disabled" :title="x.disabled?undefined:'拖动到待选择区域'" @dragstart="dragStart($event,x,true)" @dragend="dragEnd"><input v-model="right" type="checkbox" :value="x.value" :disabled="x.disabled"/><span>{{x.label}}</span><GripVertical class="hys-ui-pf-transfer-grip" :size="12" aria-hidden="true"/></label>
    <p v-if="!selected.length" :key="emptySelectedKey" class="hys-ui-pf-transfer-empty">暂无已选成员</p>
   </TransitionGroup>
  </section>
  <span class="hys-ui-pf-transfer-status" role="status">{{announcement}}</span>
 </div>
</template>
