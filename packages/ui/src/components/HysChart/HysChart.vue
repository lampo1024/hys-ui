<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {computed} from 'vue';const props=withDefaults(defineProps<{data:{label:string;value:number}[];type?:'bar'|'line';height?:number}>(),{type:'bar',height:220});const max=computed(()=>Math.max(1,...props.data.map(d=>d.value)));const points=computed(()=>props.data.map((d,i)=>`${(i+.5)/Math.max(1,props.data.length)*100},${100-d.value/max.value*90}`).join(' '));
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-panel" role="img" :aria-label="data.map(d=>d.label+': '+d.value).join(', ')"><div v-if="type==='bar'" class="hys-ui-ent-chart" :style="{height:height+'px'}"><div v-for="d in data" :key="d.label" class="hys-ui-ent-chart-item"><span :style="{height:(d.value/max*90)+'%'}" :title="d.label+': '+d.value"/><small>{{d.label}}</small></div></div><svg v-else viewBox="0 0 100 110" preserveAspectRatio="none" :style="{width:'100%',height:height+'px'}"><polyline :points="points" fill="none" stroke="var(--hys-ui-primary,var(--hys-ui-theme-primary,#3674e9))" stroke-width="2" vector-effect="non-scaling-stroke"/></svg></div></template>
