<script setup lang="ts">
import {ref,computed,watch,onDeactivated,onBeforeUnmount} from 'vue'
import {useHysRootAttrs} from '../../config'
const props=withDefaults(defineProps<{minWidth?:number;maxWidth?:number;disabled?:boolean;step?:number}>(),{minWidth:180,maxWidth:1200,step:10})
const emit=defineEmits<{resizeStart:[];resizeEnd:[value:number]}>(),width=defineModel<number>({default:320}),hysRootAttrs=useHysRootAttrs(),edge=ref<HTMLElement>()
const lower=computed(()=>Math.max(0,Number.isFinite(props.minWidth)?props.minWidth:0)),upper=computed(()=>Math.max(lower.value,Number.isFinite(props.maxWidth)?props.maxWidth:1200)),clamp=(value:number)=>Math.max(lower.value,Math.min(upper.value,Number.isFinite(value)?value:lower.value)),size=computed(()=>clamp(width.value))
let drag:{pointer:number;x:number;initial:number}|undefined
function end(){const current=drag;drag=undefined;if(!current)return;if(edge.value?.hasPointerCapture?.(current.pointer))edge.value.releasePointerCapture(current.pointer);emit('resizeEnd',size.value)}
watch(()=>[props.disabled,props.minWidth,props.maxWidth],end);onDeactivated(end);onBeforeUnmount(end)
function down(event:PointerEvent){if(props.disabled||event.button!==0)return;end();event.preventDefault();drag={pointer:event.pointerId,x:event.clientX,initial:size.value};edge.value?.setPointerCapture(event.pointerId);emit('resizeStart')}
function move(event:PointerEvent){if(!drag||props.disabled||drag.pointer!==event.pointerId)return;width.value=clamp(drag.initial+event.clientX-drag.x)}
function key(event:KeyboardEvent){if(props.disabled||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();const step=(Number.isFinite(props.step)&&props.step>0?props.step:10)*(event.shiftKey?5:1);width.value=event.key==='Home'?lower.value:event.key==='End'?upper.value:clamp(size.value+(event.key==='ArrowLeft'?-step:step))}
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-resizable" :style="{width:size+'px',minWidth:lower+'px',maxWidth:upper+'px'}"><slot/><div ref="edge" class="hys-ui-ent-resize-edge" role="separator" :tabindex="disabled?-1:0" aria-label="调整面板宽度" aria-orientation="vertical" :aria-disabled="disabled||undefined" :aria-valuemin="lower" :aria-valuemax="upper" :aria-valuenow="size" @pointerdown="down" @pointermove="move" @pointerup="end" @pointercancel="end" @lostpointercapture="end" @keydown="key"/></div></template>
