<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {computed} from 'vue';const props=defineProps<{before:string;after:string}>();const rows=computed(()=>{const a=props.before.split(/\r?\n/),b=props.after.split(/\r?\n/);return Array.from({length:Math.max(a.length,b.length)},(_,i)=>({old:a[i],next:b[i],changed:a[i]!==b[i]}))});

</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-diff"><div class="hys-ui-ent-diff-title">修改前 / 修改后（逐行对比）</div><div v-for="(r,i) in rows" :key="i" class="hys-ui-ent-diff-row" :class="{'hys-ui-changed':r.changed}"><pre>{{r.old??''}}</pre><pre>{{r.next??''}}</pre></div></div></template>
