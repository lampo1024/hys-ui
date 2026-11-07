<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()
defineProps<{separator?:string;items:{label:string;href?:string}[]}>()
</script>
<template>
 <nav v-bind="hysRootAttrs" aria-label="面包屑"><ol class="hys-ui-ex-breadcrumb">
  <li v-for="(item,index) in items" :key="index">
   <span v-if="index" aria-hidden="true"><slot name="separator">{{separator||'/'}}</slot></span>
   <template v-if="item.href&&index!==items.length-1"><slot name="link" :item="item" :index="index"><a :href="item.href">{{item.label}}</a></slot></template>
   <span v-else :aria-current="index===items.length-1?'page':undefined">{{item.label}}</span>
  </li>
 </ol></nav>
</template>
