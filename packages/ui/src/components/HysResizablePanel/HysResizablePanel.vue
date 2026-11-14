<script setup lang="ts">
import {ref,computed,watch,onDeactivated,onBeforeUnmount} from 'vue'
import {useHysRootAttrs} from '../../config'
const props=withDefaults(defineProps<{minWidth?:number;maxWidth?:number;disabled?:boolean;step?:number;edge?:'start'|'end';resetWidth?:number;snap?:readonly number[];snapThreshold?:number;resizeLabel?:string;cancelable?:boolean}>(),{minWidth:180,maxWidth:1200,step:10,edge:'end',snapThreshold:8,resizeLabel:'调整面板宽度'})
const emit=defineEmits<{resizeStart:[];resizeEnd:[value:number];resizeCancel:[width:number]}>(),width=defineModel<number>({default:320}),hysRootAttrs=useHysRootAttrs(),handle=ref<HTMLElement>()
const lower=computed(()=>Math.max(0,Number.isFinite(props.minWidth)?props.minWidth:0)),upper=computed(()=>Math.max(lower.value,Number.isFinite(props.maxWidth)?props.maxWidth:1200)),clamp=(value:number)=>Math.max(lower.value,Math.min(upper.value,Number.isFinite(value)?value:lower.value)),size=computed(()=>clamp(width.value))
let drag:{pointer:number;x:number;initial:number}|undefined
function end(){const current=drag;drag=undefined;if(!current)return;if(handle.value?.hasPointerCapture?.(current.pointer))handle.value.releasePointerCapture(current.pointer);emit('resizeEnd',size.value)}
function cancel(){
  const current=drag
  if(!current)return
  if(!props.cancelable){end();return}
  drag=undefined
  if(handle.value?.hasPointerCapture?.(current.pointer))handle.value.releasePointerCapture(current.pointer)
  const restored=clamp(current.initial)
  width.value=restored
  emit('resizeCancel',restored)
}
watch(()=>[props.disabled,props.minWidth,props.maxWidth,props.edge],end);onDeactivated(end);onBeforeUnmount(end)
function sign(){
  const rtl=handle.value&&getComputedStyle(handle.value).direction==='rtl'
  return (props.edge==='start')!==!!rtl?-1:1
}
function snapped(value:number){
  let target=clamp(value)
  let distance=Number.isFinite(props.snapThreshold)?Math.max(0,props.snapThreshold):8
  for(const point of props.snap??[]){
    const next=Math.abs(value-point)
    if(point>=lower.value&&point<=upper.value&&next<=distance){target=point;distance=next}
  }
  return target
}
function reset(){
  if(props.disabled||props.resetWidth===undefined||!Number.isFinite(props.resetWidth))return
  width.value=clamp(props.resetWidth)
}
function down(event:PointerEvent){if(props.disabled||event.button!==0)return;end();event.preventDefault();handle.value?.focus({preventScroll:true});drag={pointer:event.pointerId,x:event.clientX,initial:size.value};handle.value?.setPointerCapture?.(event.pointerId);emit('resizeStart')}
function move(event:PointerEvent){if(!drag||props.disabled||drag.pointer!==event.pointerId)return;width.value=snapped(drag.initial+(event.clientX-drag.x)*sign())}
function key(event:KeyboardEvent){
  if(event.key==='Escape'&&props.cancelable&&drag){event.preventDefault();event.stopPropagation();cancel();return}
  if(props.disabled||!['ArrowLeft','ArrowRight','Home','End','Enter'].includes(event.key))return
  if(event.key==='Enter'){if(props.resetWidth!==undefined){event.preventDefault();reset()}return}
  event.preventDefault()
  const step=(Number.isFinite(props.step)&&props.step>0?props.step:10)*(event.shiftKey?5:1)
  width.value=event.key==='Home'?lower.value:event.key==='End'?upper.value:clamp(size.value+(event.key==='ArrowLeft'?-step:step)*sign())
}
</script>
<template>
  <div v-bind="hysRootAttrs" class="hys-ui-ent-resizable" :style="{width:size+'px',maxWidth:'min(100%, '+upper+'px)'}">
    <slot :width="size" />
    <div ref="handle" class="hys-ui-ent-resize-edge" :data-edge="edge" role="separator" :tabindex="disabled?-1:0"
      :aria-label="resizeLabel" aria-orientation="vertical" :aria-disabled="disabled||undefined"
      :aria-valuemin="lower" :aria-valuemax="upper" :aria-valuenow="size"
      @pointerdown="down" @pointermove="move" @pointerup="end" @pointercancel="cancel"
      @lostpointercapture="cancel" @dblclick="reset" @keydown="key" />
  </div>
</template>

<style scoped>
.hys-ui-ent-resize-edge {
  right: auto;
  inset-inline-end: 0;
}
.hys-ui-ent-resize-edge[data-edge="start"] {
  inset-inline-end: auto;
  inset-inline-start: 0;
}
.hys-ui-ent-resize-edge:not([aria-disabled="true"]):hover,
.hys-ui-ent-resize-edge:focus-visible {
  background: var(--hys-ui-primary-soft, var(--hys-ui-theme-primary-soft));
}
.hys-ui-ent-resize-edge[aria-disabled="true"] {
  cursor: default;
}
</style>
