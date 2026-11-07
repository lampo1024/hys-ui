<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {computed} from 'vue';const props=defineProps<{items:{title:string;time?:string;description?:string;status?:'done'|'current'|'pending';color?:string}[];reverse?:boolean;pending?:string}>();const entries=computed(()=>props.reverse?[...props.items].reverse():props.items)
</script>
<template><ol v-bind="hysRootAttrs" class="hys-ui-ex-timeline"><li v-for="(item,index) in entries" :key="index" :class="item.status?'hys-ui-'+item.status:undefined" :style="{'--hys-ui-timeline-color':item.color}"><slot name="item" :item="item" :index="index"><strong>{{item.title}}</strong><small v-if="item.time">{{item.time}}</small><p v-if="item.description">{{item.description}}</p></slot></li><li v-if="pending" class="hys-ui-pending">{{pending}}</li></ol></template>
<style scoped>.hys-ui-ex-timeline li:before{background:var(--hys-ui-timeline-color,var(--hys-ui-muted,var(--hys-ui-theme-muted)))}.hys-ui-ex-timeline li.hys-ui-done:before,.hys-ui-ex-timeline li.hys-ui-current:before{background:var(--hys-ui-timeline-color,var(--hys-ui-primary,var(--hys-ui-theme-primary)))}</style>
