<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import {nextTick, ref, onDeactivated} from 'vue'
import {ChevronDown, ChevronUp, GripVertical} from 'lucide-vue-next'
type Item={id:string;label:string}
const props=defineProps<{modelValue:Item[];disabled?:boolean}>()
const emit=defineEmits<{'update:modelValue':[value:Item[]]}>()
const root=ref<HTMLElement>()
const dragging=ref<string|null>(null)
const target=ref<{id:string;position:'before'|'after'}|null>(null)
const announcement=ref('')
async function move(from:number,to:number) {
 if(props.disabled||from===to||from<0||from>=props.modelValue.length||to<0||to>=props.modelValue.length)return
 const copy=[...props.modelValue]
 const item=copy.splice(from,1)[0]
 copy.splice(to,0,item)
 emit('update:modelValue',copy)
 announcement.value=item.label+'已移至第 '+(to+1)+' 项'
 await nextTick()
 Array.from(root.value?.querySelectorAll<HTMLElement>('[data-sort-id]')||[]).find(el=>el.dataset.sortId===item.id)?.focus({preventScroll:true})
}
function keyboard(event:KeyboardEvent,index:number) {
 if(event.altKey&&(event.key==='ArrowUp'||event.key==='ArrowDown')) {
  event.preventDefault()
  move(index,index+(event.key==='ArrowUp'?-1:1))
 }
}
function dragStart(event:DragEvent,item:Item) {
 if(props.disabled||!event.dataTransfer){event.preventDefault();return}
 dragging.value=item.id
 const row=(event.currentTarget as HTMLElement).closest<HTMLElement>('[data-sort-id]')
 if(row)event.dataTransfer.setDragImage(row,24,row.offsetHeight/2)
 event.dataTransfer.effectAllowed='move'
 event.dataTransfer.setData('text/plain',item.id)
 announcement.value='正在拖动'+item.label
}
function destination(id:string,position:'before'|'after') {
 const from=props.modelValue.findIndex(item=>item.id===dragging.value)
 const index=props.modelValue.findIndex(item=>item.id===id)
 if(from<0||index<0)return -1
 const boundary=index+(position==='after'?1:0)
 return boundary-(from<boundary?1:0)
}
function dragOver(event:DragEvent,item:Item) {
 if(!dragging.value)return
 event.preventDefault()
 if(event.dataTransfer)event.dataTransfer.dropEffect='move'
 const rect=(event.currentTarget as HTMLElement).getBoundingClientRect()
 const position=event.clientY<rect.top+rect.height/2?'before':'after'
 const from=props.modelValue.findIndex(item=>item.id===dragging.value)
 target.value=destination(item.id,position)===from?null:{id:item.id,position}
}
function dragEnd(){dragging.value=null;target.value=null}
function dragLeave(event:DragEvent) {
 if(event.relatedTarget instanceof Node&&root.value?.contains(event.relatedTarget))return
 target.value=null
}
function drop(event:DragEvent) {
 if(!dragging.value)return
 event.preventDefault()
 if(target.value) {
  const from=props.modelValue.findIndex(item=>item.id===dragging.value)
  move(from,destination(target.value.id,target.value.position))
 }
 dragEnd()
}
onDeactivated(dragEnd)

</script>
<template>
 <div v-bind="hysRootAttrs" ref="root" class="hys-ui-pf-sortable" :class="{'hys-ui-is-sorting':dragging}" @dragleave="dragLeave" @drop="drop">
  <TransitionGroup name="hys-ui-sort-motion" tag="div" class="hys-ui-v4-sort" role="list" aria-label="可排序列表">
   <div v-for="(item,index) in modelValue" :key="item.id" class="hys-ui-v4-sort-row" :class="{'hys-ui-is-dragging':dragging===item.id,'hys-ui-is-drop-before':target?.id===item.id&&target.position==='before','hys-ui-is-drop-after':target?.id===item.id&&target.position==='after'}" role="listitem" tabindex="0" :data-sort-id="item.id" :aria-label="item.label+'，按 Alt 加上下方向键调整顺序'" @keydown="keyboard($event,index)" @dragover="dragOver($event,item)">
    <button type="button" class="hys-ui-pf-sort-handle" :draggable="!disabled" :disabled="disabled" :aria-label="'拖动排序'+item.label" title="拖动排序，也可按 Alt 加上下方向键" @dragstart.stop="dragStart($event,item)" @dragend.stop="dragEnd"><GripVertical class="hys-ui-pf-sort-grip" :size="16" aria-hidden="true"/></button>
    <span class="hys-ui-pf-sort-label"><slot name="item" :item="item">{{item.label}}</slot></span>
    <div class="hys-ui-v4-sort-actions">
     <button type="button" :disabled="disabled||index===0" :aria-label="'上移'+item.label" @click="move(index,index-1)"><ChevronUp :size="15" aria-hidden="true"/></button>
     <button type="button" :disabled="disabled||index===modelValue.length-1" :aria-label="'下移'+item.label" @click="move(index,index+1)"><ChevronDown :size="15" aria-hidden="true"/></button>
    </div>
   </div>
  </TransitionGroup>
  <span class="hys-ui-pf-sort-status" role="status">{{announcement}}</span>
 </div>
</template>
<style scoped>
.hys-ui-v4-sort-row{position:relative;gap:10px;cursor:default;user-select:none;transition:transform var(--hys-ui-motion-base) var(--hys-ui-motion-ease),border-color var(--hys-ui-motion-fast),background-color var(--hys-ui-motion-fast),box-shadow var(--hys-ui-motion-fast),opacity var(--hys-ui-motion-fast)}
.hys-ui-v4-sort-row:has(.hys-ui-pf-sort-handle:hover){border-color:color-mix(in srgb,var(--hys-ui-primary,var(--hys-ui-theme-primary)) 40%,var(--hys-ui-border,var(--hys-ui-theme-border)));background:var(--hys-ui-surface-alt,var(--hys-ui-theme-surface-alt))}
.hys-ui-pf-sort-handle{display:grid;place-items:center;flex-shrink:0;width:26px;height:30px;margin:-5px 0 -5px -5px;padding:0;border:0;border-radius:5px;background:transparent;cursor:grab}.hys-ui-pf-sort-handle:hover{background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft))}.hys-ui-pf-sort-handle:active{cursor:grabbing;transform:none}.hys-ui-pf-sort-handle:focus-visible{outline:2px solid var(--hys-ui-primary,var(--hys-ui-theme-primary));outline-offset:1px}
.hys-ui-pf-sort-grip{flex-shrink:0;color:var(--hys-ui-muted,var(--hys-ui-theme-muted));transition:color var(--hys-ui-motion-fast)}
.hys-ui-pf-sort-handle:hover .hys-ui-pf-sort-grip{color:var(--hys-ui-primary,var(--hys-ui-theme-primary))}
.hys-ui-pf-sort-label{min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.hys-ui-v4-sort-actions{flex-shrink:0}
.hys-ui-v4-sort-actions button{display:grid;place-items:center;padding:6px;background:var(--hys-ui-surface,var(--hys-ui-theme-surface));color:var(--hys-ui-muted,var(--hys-ui-theme-muted))}
.hys-ui-v4-sort-actions button:not(:disabled):hover{color:var(--hys-ui-primary,var(--hys-ui-theme-primary));border-color:var(--hys-ui-primary,var(--hys-ui-theme-primary));background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft))}
.hys-ui-is-sorting .hys-ui-pf-sort-handle{cursor:grabbing}
.hys-ui-v4-sort-row.hys-ui-is-dragging{opacity:.35;border-style:dashed;background:var(--hys-ui-primary-soft,var(--hys-ui-theme-primary-soft))}
.hys-ui-v4-sort-row.hys-ui-is-drop-before,.hys-ui-v4-sort-row.hys-ui-is-drop-after{border-color:var(--hys-ui-primary,var(--hys-ui-theme-primary));box-shadow:0 0 0 2px color-mix(in srgb,var(--hys-ui-primary,var(--hys-ui-theme-primary)) 8%,transparent)}
.hys-ui-is-drop-before::before,.hys-ui-is-drop-after::after{content:'';position:absolute;left:-1px;right:-1px;height:3px;border-radius:3px;background:var(--hys-ui-primary,var(--hys-ui-theme-primary));box-shadow:0 0 0 2px var(--hys-ui-surface,var(--hys-ui-theme-surface));pointer-events:none}
.hys-ui-is-drop-before::before{top:-7px}
.hys-ui-is-drop-after::after{bottom:-7px}
.hys-ui-v4-sort-row:focus-visible{outline:2px solid var(--hys-ui-primary,var(--hys-ui-theme-primary));outline-offset:2px}
.hys-ui-pf-sort-status{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
@media(prefers-reduced-motion:reduce){.hys-ui-v4-sort-row,.hys-ui-pf-sort-grip{transition:none}}
</style>
