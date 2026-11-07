<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import HysSelect from '../HysSelect/HysSelect.vue';
export interface KanbanCard{id:string;title:string;column:string;owner?:string}const props=defineProps<{columns:{id:string;title:string}[];cards:KanbanCard[]}>();const emit=defineEmits<{move:[id:string,column:string]}>();function drop(e:DragEvent,col:string){e.preventDefault();const id=e.dataTransfer?.getData('text/plain');if(id&&props.cards.some(c=>c.id===id))emit('move',id,col)}
</script>
<template><div v-bind="hysRootAttrs" class="hys-ui-ent-kanban"><section v-for="col in columns" :key="col.id" class="hys-ui-ent-kanban-col" @dragover.prevent @drop="drop($event,col.id)"><header><strong>{{col.title}}</strong><span>{{cards.filter(c=>c.column===col.id).length}}</span></header><article v-for="card in cards.filter(c=>c.column===col.id)" :key="card.id" draggable="true" @dragstart="$event.dataTransfer?.setData('text/plain',card.id)"><strong>{{card.title}}</strong><small>{{card.owner}}</small><HysSelect :model-value="card.column" :aria-label="'移动 '+card.title" :options="columns.map(column=>({label:column.title,value:column.id}))" @update:model-value="emit('move',card.id,$event)"/></article></section></div></template>
