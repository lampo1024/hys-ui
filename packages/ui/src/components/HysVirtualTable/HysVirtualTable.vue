<script setup lang="ts">
import {useHysRootAttrs} from '../../config'
const hysRootAttrs=useHysRootAttrs()

import {ref,computed,watch} from 'vue';type Row={id:string|number;[key:string]:unknown};type Column={key:string;label:string;width?:number};const props=withDefaults(defineProps<{rows:Row[];columns:Column[];rowHeight?:number;height?:number;loading?:boolean;emptyText?:string;rowKey?:string}>(),{rowHeight:42,height:280});const viewport=ref<HTMLElement>();const scrollTop=ref(0),overscan=5;const safeHeight=computed(()=>Math.max(1,props.rowHeight));const safeViewport=computed(()=>Math.max(1,props.height));const start=computed(()=>Math.min(Math.max(0,props.rows.length-1),Math.max(0,Math.floor(Math.max(0,scrollTop.value-42)/safeHeight.value)-overscan)));const count=computed(()=>Math.ceil(safeViewport.value/safeHeight.value)+overscan*2);watch(()=>props.rows.length,()=>{scrollTop.value=0;if(viewport.value)viewport.value.scrollTop=0});const visible=computed(()=>props.rows.slice(start.value,start.value+count.value));const contentWidth=computed(()=>props.columns.reduce((sum,column)=>sum+(column.width||160),0));const grid=computed(()=>props.columns.map(x=>`${x.width||160}px`).join(' '));

</script>
<template>
 <div v-bind="hysRootAttrs" class="hys-ui-v4-table" role="table" :aria-busy="loading" :aria-rowcount="rows.length+1" :aria-colcount="columns.length">
  <div ref="viewport" class="hys-ui-v4-table-viewport" :style="{height:(safeViewport+42)+'px'}" @scroll="scrollTop=($event.target as HTMLElement).scrollTop">
   <div class="hys-ui-v4-table-content" :style="{minWidth:contentWidth+'px'}">
    <div class="hys-ui-v4-table-row hys-ui-v4-table-head" role="row" :style="{gridTemplateColumns:grid}">
     <span v-for="c in columns" :key="c.key" role="columnheader"><slot name="header" :column="c">{{c.label}}</slot></span>
    </div>
    <div :style="{height:Math.max(rows.length*safeHeight,(!rows.length||loading)?safeHeight:0)+'px',position:'relative'}">
     <p v-if="loading||!rows.length" class="hys-ui-floating-empty" role="status"><slot name="empty">{{loading?'加载中…':emptyText||'暂无数据'}}</slot></p><div v-else :style="{transform:'translateY('+start*safeHeight+'px)'}">
      <div v-for="(r,i) in visible" :key="String(r[rowKey||'id']??start+i)" class="hys-ui-v4-table-row" role="row" :aria-rowindex="start+i+2" :style="{height:safeHeight+'px',gridTemplateColumns:grid}">
       <span v-for="c in columns" :key="c.key" role="cell" :title="String(r[c.key]??'')"><slot :name="c.key" :row="r" :value="r[c.key]">{{r[c.key]}}</slot></span>
      </div>
     </div>
    </div>
   </div>
  </div>
 </div>
</template>
