<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {ref,useId,onBeforeUnmount,onDeactivated,watch} from 'vue';import {useFloating,type Placement} from '../../composables/useFloating'
const props=withDefaults(defineProps<{text?:string;placement?:Placement;disabled?:boolean;showDelay?:number;hideDelay?:number}>(),{placement:'top-start',showDelay:0,hideDelay:70}),emit=defineEmits<{visibleChange:[open:boolean]}>(),trigger=ref<HTMLElement>(),panel=ref<HTMLElement>(),id=useId()
const {open,style,show,close,restoringFocus}=useFloating(trigger,panel,{get placement(){return props.placement},gap:7})
let timer:ReturnType<typeof setTimeout>|undefined
function enter(){clearTimeout(timer);if(!props.disabled&&!restoringFocus.value)timer=setTimeout(()=>show(),props.showDelay)}function leave(){clearTimeout(timer);timer=setTimeout(()=>close(),props.hideDelay)}function cleanup(){clearTimeout(timer);close()}
watch(open,value=>emit('visibleChange',value));watch(()=>props.disabled,value=>{if(value)cleanup()});onBeforeUnmount(cleanup);onDeactivated(cleanup)
</script>
<template><span ref="trigger" v-bind="hysRootAttrs" class="hys-ui-tooltip-wrap" :tabindex="disabled?-1:0" :aria-describedby="open?id:undefined" @pointerenter="enter" @pointerleave="leave" @focusin="enter" @focusout="leave"><slot/></span><Teleport to="body"><span v-if="open" :id="id" ref="panel" v-bind="hysRootAttrs" class="hys-ui-tooltip-bubble hys-ui-floating-tooltip" role="tooltip" :style="style"><slot name="content">{{text}}</slot></span></Teleport></template>
<style scoped></style>
