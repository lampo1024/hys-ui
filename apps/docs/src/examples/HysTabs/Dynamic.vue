<script setup lang="ts">
import {ref} from 'vue'
import {HysTabs,HysCheckbox,type HysTabItem,type HysTabValue} from 'hys-ui'
const active=ref<HysTabValue>('home'),protect=ref(false),event=ref('尚未操作')
let serial=2
const items=ref<HysTabItem[]>([{value:'home',label:'固定页签',closable:false,content:'此页签不可关闭。'},{value:1,label:'文档 1',content:'可编辑文档 1。'},{value:2,label:'文档 2',content:'可编辑文档 2。'}])
function add(){const value=++serial;items.value.push({value,label:'文档 '+value,content:'新建文档 '+value});active.value=value;event.value='已添加文档 '+value}
function close(value:HysTabValue){const index=items.value.findIndex(item=>item.value===value);if(active.value===value)active.value=items.value[index+1]?.value??items.value[index-1]?.value??'home';items.value=items.value.filter(item=>item.value!==value);event.value='已关闭 '+value}
async function beforeClose(){await new Promise(resolve=>setTimeout(resolve,250));return !protect.value}
</script>
<template><div class="demo-content"><HysCheckbox v-model="protect" label="阻止关闭（模拟未保存内容）"/><HysTabs v-model="active" :items="items" type="card" editable :before-close="beforeClose" @add="add" @close="close"/><output class="state-output" aria-live="polite">{{event}} · 当前：{{active}}</output><p class="scenario-note">添加和关闭通过事件交给调用方修改 items；单项 closable=false 优先于整体设置。关闭包含异步检查，等待期间不会重复提交。</p></div></template>