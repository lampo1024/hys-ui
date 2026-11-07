<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {ref,computed,watch} from 'vue'
const props=withDefaults(defineProps<{name?:string;src?:string;size?:number;shape?:'circle'|'square';fit?:'cover'|'contain'|'fill';alt?:string}>(),{name:'',size:36,shape:'circle',fit:'cover'})
const emit=defineEmits<{error:[event:Event]}>(),failed=ref(false),initials=computed(()=>props.name.trim().slice(0,2).toUpperCase()||'?')
watch(()=>props.src,()=>failed.value=false)
</script>
<template><span v-bind="hysRootAttrs" class="hys-ui-ex-avatar" :style="{width:size+'px',height:size+'px',fontSize:Math.max(11,size*.34)+'px',borderRadius:shape==='square'?'8px':'50%'}" :aria-label="alt||name"><img v-if="src&&!failed" :src="src" :alt="alt||name" :style="{objectFit:fit}" @error="failed=true;emit('error',$event)"/><slot v-else>{{initials}}</slot></span></template>
