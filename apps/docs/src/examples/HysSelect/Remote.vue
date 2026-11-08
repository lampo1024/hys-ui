<script setup lang="ts">
import { onActivated,onBeforeUnmount,onDeactivated,ref } from 'vue'
import { HysButton,HysCheckbox,HysSelect,type HysSelectOption } from 'hys-ui'
const records=[{value:'keller',label:'Keller · 产品设计'},{value:'lisa',label:'Lisa · 前端开发'},{value:'david',label:'David · 后端开发'},{value:'amy',label:'Amy · 质量保障'},{value:'jack',label:'Jack · 平台工程'}]
const value=ref('lisa'),options=ref<HysSelectOption[]>([records[1]]),loading=ref(false),error=ref(''),fail=ref(false),query=ref('')
let timer:ReturnType<typeof setTimeout>|undefined,generation=0,active=true
function cancel(){generation++;clearTimeout(timer);loading.value=false}
function search(text:string){query.value=text;cancel();if(!active)return;loading.value=true;error.value='';const token=generation;timer=setTimeout(()=>{if(!active||token!==generation)return;loading.value=false;if(fail.value){options.value=[];error.value='暂时无法获取成员，请重试';return}options.value=records.filter(item=>item.label.toLowerCase().includes(text.trim().toLowerCase()))},500)}
onDeactivated(()=>{active=false;cancel()});onActivated(()=>{active=true});onBeforeUnmount(()=>{active=false;cancel()})
</script>
<template><div><div class="demo-controls"><HysCheckbox v-model="fail" label="模拟请求失败"/><HysButton variant="secondary" size="sm" :disabled="loading" @click="search(query)">重新加载</HysButton></div>
<div class="demo-content"><label class="select-demo-field"><span>搜索远程成员</span><HysSelect v-model="value" :options="options" filterable remote clearable :loading="loading" placeholder="搜索成员姓名" aria-label="搜索远程成员" @search="search" @visible-change="$event&&search('')"><template #empty><span v-if="error">{{error}}</span><span v-else>没有匹配成员</span></template><template #footer><div v-if="error" class="select-demo-footer"><HysButton variant="ghost" size="sm" @click="search(query)">重试</HysButton></div></template></HysSelect></label>
<p class="scenario-note">模拟异步搜索、加载、空结果和失败重试。新结果返回后，已选成员的显示名称仍会保留；离开页面会取消等待中的请求。</p></div><output class="state-output">成员：{{value||'未选择'}} · {{loading?'加载中':error?'请求失败':'就绪'}}</output></div></template>
