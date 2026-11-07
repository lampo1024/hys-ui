<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import {computed} from 'vue'
import HysTree,{type TreeNode} from '../HysTree/HysTree.vue'
export interface OrgNode {id:string;name:string;parentId?:string;disabled?:boolean}
const props=defineProps<{nodes:OrgNode[];modelValue?:string;searchable?:boolean;checkable?:boolean;checkedKeys?:string[]}>()
const emit=defineEmits<{ 'update:modelValue':[id:string];'update:checkedKeys':[keys:string[]] }>()
const tree=computed<TreeNode[]>(()=>{const map=new Map<string,TreeNode>();for(const n of props.nodes)if(!map.has(n.id))map.set(n.id,{id:n.id,label:n.name,disabled:n.disabled,children:[]});const roots:TreeNode[]=[];for(const n of props.nodes){const node=map.get(n.id)!;if(n.parentId&&n.parentId!==n.id&&map.has(n.parentId)){let p=n.parentId;const seen=new Set([n.id]);let cyclic=false;while(p){if(seen.has(p)){cyclic=true;break}seen.add(p);p=props.nodes.find(x=>x.id===p)?.parentId||''}if(!cyclic){map.get(n.parentId)!.children!.push(node);continue}}roots.push(node)}return roots})

</script>
<template><HysTree v-bind="hysRootAttrs" :nodes="tree" :model-value="modelValue" :checked-keys="checkedKeys" :checkable="checkable" :searchable="searchable!==false" default-expand-all @update:model-value="emit('update:modelValue',$event)" @update:checked-keys="emit('update:checkedKeys',$event)"/></template>
