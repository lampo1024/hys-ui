<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {onActivated,onBeforeUnmount,onDeactivated,ref,watch} from 'vue';import {CircleAlert,CircleCheck,Info,X} from 'lucide-vue-next'
const props=withDefaults(defineProps<{message:string;type?:'success'|'error'|'info';duration?:number;closable?:boolean;position?:'top'|'top-right'|'bottom'|'bottom-right'}>(),{type:'success',duration:3000,closable:true,position:'bottom-right'}),emit=defineEmits<{close:[]}>(),active=ref(true)
let timer:ReturnType<typeof setTimeout>|undefined;function pause(){clearTimeout(timer)}function start(){pause();if(active.value&&props.message&&props.duration>0)timer=setTimeout(()=>emit('close'),props.duration)}watch(()=>[props.message,props.duration],start,{immediate:true});onBeforeUnmount(pause);onDeactivated(()=>{active.value=false;pause()});onActivated(()=>{active.value=true;start()})
</script>
<template><Teleport to="body"><Transition name="hys-ui-toast-motion"><div v-if="message&&active" v-bind="hysRootAttrs" class="hys-ui-toast" :class="['hys-ui-toast-'+type,'hys-ui-toast-position-'+position]" :role="type==='error'?'alert':'status'" @mouseenter="pause" @mouseleave="start"><span><component :is="type==='error'?CircleAlert:type==='info'?Info:CircleCheck" :size="18"/></span>{{message}}<button v-if="closable" type="button" aria-label="关闭提示" @click="emit('close')"><X :size="14"/></button></div></Transition></Teleport></template>
<style scoped>.hys-ui-toast-position-top,.hys-ui-toast-position-top-right{top:24px;bottom:auto}.hys-ui-toast-position-top,.hys-ui-toast-position-bottom{left:50%;right:auto;transform:translateX(-50%)}.hys-ui-toast-position-bottom{bottom:24px;top:auto}</style>
