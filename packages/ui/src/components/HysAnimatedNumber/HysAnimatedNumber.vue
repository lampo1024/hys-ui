<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {useMotion} from '../../motion/useMotion'
const {effectiveMotion}=useMotion()

import {ref,watch,onBeforeUnmount,onDeactivated,onActivated} from 'vue';
const props=withDefaults(defineProps<{value:number;duration?:number;decimals?:number}>(),{duration:650,decimals:0});
const shown=ref(Number.isFinite(props.value)?props.value:0);let frame=0;let active=true;
function finite(value:number){return Number.isFinite(value)?value:0}
function animate(target:number){target=finite(target);cancelAnimationFrame(frame);const reduce=effectiveMotion.value==='off'||!Number.isFinite(props.duration)||props.duration<=0;if(reduce){shown.value=target;return;}const from=shown.value;const start=performance.now();const duration=Math.max(1,props.duration);function step(now:number){const t=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-t,3);shown.value=from+(target-from)*eased;if(t<1)frame=requestAnimationFrame(step)}frame=requestAnimationFrame(step)}
watch(()=>[props.value,props.duration,effectiveMotion.value] as const,([value])=>{if(active)animate(value);else shown.value=finite(value)});onDeactivated(()=>{active=false;cancelAnimationFrame(frame)});onActivated(()=>{active=true;shown.value=finite(props.value)});onBeforeUnmount(()=>cancelAnimationFrame(frame));

</script>
<template><span v-bind="hysRootAttrs" class="hys-ui-motion-number" :aria-label="String(finite(value))">{{shown.toFixed(Number.isFinite(decimals)?Math.max(0,Math.min(5,Math.floor(decimals))):0)}}</span></template>
