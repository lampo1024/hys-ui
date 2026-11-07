<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
withDefaults(defineProps<{lines?:number;loading?:boolean;active?:boolean;avatar?:boolean;avatarSize?:number;title?:boolean}>(),{lines:3,loading:true,active:true,avatarSize:40,title:true})
</script>
<template><div v-bind="hysRootAttrs" :aria-busy="loading"><slot v-if="!loading"/><div v-else class="hys-ui-skeleton-group" role="status" aria-label="加载中" :class="{'hys-ui-skeleton-static':!active}"><div v-if="avatar" class="hys-ui-skeleton" :style="{width:avatarSize+'px',height:avatarSize+'px',borderRadius:'50%'}"/><div v-if="title" class="hys-ui-skeleton" style="width:40%;height:20px"/><div v-for="i in Math.max(0,Math.floor(lines))" :key="i" class="hys-ui-skeleton" :style="{width:i===lines?'65%':'100%'}"/></div></div></template>
<style scoped>.hys-ui-skeleton-static .hys-ui-skeleton{animation:none}</style>
