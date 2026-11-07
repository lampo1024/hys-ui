<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {useMotion} from '../../motion/useMotion'
const {effectiveMotion}=useMotion()

import {ref,watch,onBeforeUnmount,onDeactivated,onActivated} from 'vue';
const props=withDefaults(defineProps<{value:number;duration?:number;decimals?:number}>(),{duration:650,decimals:0});
const shown=ref(props.value);let frame=0;let active=true;
function animate(target:number){cancelAnimationFrame(frame);const reduce=effectiveMotion.value==='off';if(reduce){shown.value=target;return;}const from=shown.value;const start=performance.now();const duration=Math.max(1,props.duration);function step(now:number){const t=Math.min(1,(now-start)/duration);const eased=1-Math.pow(1-t,3);shown.value=from+(target-from)*eased;if(t<1)frame=requestAnimationFrame(step)}frame=requestAnimationFrame(step)}
watch(()=>props.value,value=>{if(active)animate(value);else shown.value=value});onDeactivated(()=>{active=false;cancelAnimationFrame(frame)});onActivated(()=>{active=true;shown.value=props.value});onBeforeUnmount(()=>cancelAnimationFrame(frame));

</script>
<template><span v-bind="hysRootAttrs" class="hys-ui-motion-number" :aria-label="String(value)">{{shown.toFixed(Math.max(0,Math.min(5,decimals)))}}</span></template>
