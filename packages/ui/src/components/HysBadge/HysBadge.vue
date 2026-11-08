<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {X} from 'lucide-vue-next'
withDefaults(defineProps<{tone?:'blue'|'green'|'orange'|'red'|'purple'|'gray';size?:'sm'|'md';round?:boolean;closable?:boolean;dot?:boolean;value?:number|string;max?:number;showZero?:boolean}>(),{tone:'blue',max:99,size:'md'})
const emit=defineEmits<{close:[event:MouseEvent]}>()
</script>
<template><span v-bind="hysRootAttrs" class="hys-ui-badge-wrap"><span v-if="$slots.default||closable" class="hys-ui-badge" :class="['hys-ui-badge-'+tone,{'hys-ui-badge-content':dot||value!==undefined}]" :style="{borderRadius:round?'99px':undefined,fontSize:size==='sm'?'10px':undefined}"><slot/><button v-if="closable" type="button" aria-label="关闭标签" @click.stop="emit('close',$event)"><X :size="12"/></button></span><sup v-if="dot||value!==undefined&&(value!==0||showZero)" class="hys-ui-badge-counter" :class="{'hys-ui-badge-dot':dot,'hys-ui-badge-standalone':!$slots.default&&!closable}">{{dot?'':typeof value==='number'&&value>max?max+'+':value}}</sup></span></template>
<style scoped>.hys-ui-badge-wrap{position:relative;display:inline-flex}.hys-ui-badge{gap:5px}.hys-ui-badge button{display:grid;place-items:center;padding:0;border:0;background:transparent;color:inherit}.hys-ui-badge-counter{position:absolute;top:0;right:0;transform:translate(50%,-50%);padding:1px 5px;border-radius:99px;background:#ed4556;color:#fff;font-size:10px;line-height:15px}.hys-ui-badge-dot{width:7px;height:7px;padding:0}.hys-ui-badge.hys-ui-badge-content{padding:0;background:transparent;color:inherit}.hys-ui-badge-counter.hys-ui-badge-standalone{position:static;transform:none;align-self:center}
</style>
