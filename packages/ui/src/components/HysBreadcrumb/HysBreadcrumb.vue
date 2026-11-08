<script setup lang="ts">
import type {Component} from 'vue'
import {useHysRootAttrs} from '../../config'
export interface HysBreadcrumbItem {label:string;href?:string;disabled?:boolean;target?:string;rel?:string;separator?:string;showSeparator?:boolean}
withDefaults(defineProps<{separator?:string;separatorIcon?:Component;items:HysBreadcrumbItem[];ariaLabel?:string}>(),{separator:'/',ariaLabel:'面包屑'})
const emit=defineEmits<{select:[item:HysBreadcrumbItem,index:number,event:MouseEvent]}>(),hysRootAttrs=useHysRootAttrs()
function safeRel(item:HysBreadcrumbItem){return item.target==='_blank'?[...new Set((item.rel||'').split(/\s+/).filter(Boolean).concat('noopener','noreferrer'))].join(' '):item.rel}
</script>
<template>
  <nav v-bind="hysRootAttrs" :aria-label="ariaLabel"><ol class="hys-ui-ex-breadcrumb">
    <li v-for="(item,index) in items" :key="index">
      <span v-if="index&&item.showSeparator!==false" class="hys-ui-breadcrumb-separator" aria-hidden="true"><slot name="separator" :item="item" :index="index"><component :is="separatorIcon" v-if="separatorIcon" :size="14"/><template v-else>{{item.separator??separator}}</template></slot></span>
      <template v-if="item.href&&!item.disabled&&index!==items.length-1"><slot name="link" :item="item" :index="index"><a :href="item.href" :target="item.target" :rel="safeRel(item)" @click="emit('select',item,index,$event)"><slot name="item" :item="item" :index="index" :current="false">{{item.label}}</slot></a></slot></template>
      <span v-else class="hys-ui-breadcrumb-item" :aria-disabled="item.disabled||undefined" :aria-current="index===items.length-1?'page':undefined"><slot name="item" :item="item" :index="index" :current="index===items.length-1">{{item.label}}</slot></span>
    </li>
  </ol></nav>
</template>
<style scoped>
.hys-ui-ex-breadcrumb li{min-width:0;align-items:center;gap:9px;line-height:1.6}.hys-ui-ex-breadcrumb a,.hys-ui-breadcrumb-item{display:inline-flex;align-items:center;gap:6px;min-width:0;overflow-wrap:anywhere}.hys-ui-ex-breadcrumb a{text-decoration:none}.hys-ui-ex-breadcrumb a:hover{text-decoration:underline}.hys-ui-breadcrumb-item[aria-current=page]{font-weight:500;color:var(--hys-ui-text,var(--hys-ui-theme-text))}.hys-ui-breadcrumb-item[aria-disabled=true]{opacity:.5}.hys-ui-breadcrumb-separator{display:inline-flex;align-items:center;flex:none;color:var(--hys-ui-muted,var(--hys-ui-theme-muted))}
</style>