<script setup lang="ts">
import type {HysPopupMotionProps} from '../../motion/popup'
import {ref,watch} from 'vue'
import HysModal from '../HysModal/HysModal.vue'
import HysButton from '../HysButton/HysButton.vue'
const props=withDefaults(defineProps<HysPopupMotionProps & {steps:{title:string;description:string}[];current?:number;closeOnEscape?:boolean}>(),{closeOnEscape:true}),open=defineModel<boolean>({default:false}),emit=defineEmits<{finish:[];close:[];change:[index:number];'update:current':[index:number]}>(),index=ref(normalize(props.current??0))
function normalize(value:number){return Math.max(0,Math.min(Math.max(0,props.steps.length-1),Number.isFinite(value)?Math.floor(value):0))}
watch(()=>props.current,value=>{if(value!==undefined)index.value=normalize(value)});watch(open,value=>{if(value)index.value=normalize(props.current??0)})
watch(()=>props.steps.length,()=>{index.value=normalize(index.value)})
function move(value:number){index.value=normalize(value);emit('change',index.value);emit('update:current',index.value)}function close(){open.value=false;emit('close')}function next(){if(index.value>=props.steps.length-1){emit('finish');close()}else move(index.value+1)}
</script>
<template><HysModal :transition="popupTransition==='none'?false:popupTransition==='slide-fade'?'slide':popupTransition" :transition-duration="popupTransitionDuration" :open="open" :title="steps[index]?.title||'引导'" :close-on-escape="closeOnEscape!==false" :close-on-mask="false" @close="close"><p>{{steps[index]?.description||'暂无引导步骤'}}</p><template #footer><span>{{steps.length?index+1:0}} / {{steps.length}}</span><HysButton variant="ghost" @click="close">跳过</HysButton><HysButton variant="secondary" :disabled="index===0" @click="move(index-1)">上一步</HysButton><HysButton @click="next">{{index>=steps.length-1?'完成':'下一步'}}</HysButton></template></HysModal></template>
