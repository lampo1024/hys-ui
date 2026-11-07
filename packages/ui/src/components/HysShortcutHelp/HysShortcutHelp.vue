<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
defineProps<{shortcuts:{keys:string;description:string}[]}>();

</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-panel"><div v-for="s in shortcuts" :key="s.keys" class="hys-ui-ent-shortcut"><span>{{s.description}}</span><kbd>{{s.keys}}</kbd></div></div></template>
