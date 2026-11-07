<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
import {Inbox} from 'lucide-vue-next';withDefaults(defineProps<{title?:string;description?:string;image?:string;imageSize?:number}>(),{title:'暂无数据',description:'当前没有符合条件的内容',imageSize:48})
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ex-empty"><div class="hys-ui-ex-empty-icon" aria-hidden="true"><slot name="image"><img v-if="image" :src="image" alt="" :style="{width:imageSize+'px',height:imageSize+'px',objectFit:'contain'}"/><Inbox v-else :size="imageSize"/></slot></div><strong>{{title}}</strong><p><slot name="description">{{description}}</slot></p><slot/></div></template>
