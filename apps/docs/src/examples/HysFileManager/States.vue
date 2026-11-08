<script setup lang="ts">
import { ref } from 'vue'
import { HysButton,HysCheckbox,HysFileManager,type ManagedFile } from 'hys-ui'
const disabled=ref(false),files=ref<ManagedFile[]>([{id:'guide',name:'使用说明.pdf',size:2048}]),message=ref('等待操作')
let nextId=0
function upload(selected:File[]){files.value=[...files.value,...selected.map(file=>({id:'selected-'+nextId++,name:file.name,size:file.size}))];message.value='已接收 '+selected.length+' 个文件，由宿主处理上传'}
</script>
<template><div><div class="demo-controls"><HysCheckbox v-model="disabled" label="禁用全部操作"/><HysButton variant="secondary" size="sm" :disabled="disabled||!files.length" @click="files=[]">清空列表</HysButton></div><div class="demo-content"><HysFileManager v-model="files" :disabled="disabled" @upload="upload" @remove="id=>files=files.filter(file=>file.id!==id)" @download="id=>message='下载请求：'+files.find(file=>file.id===id)?.name"/><p class="scenario-note">可使用 Tab 聚焦选择区域，按 Enter 或空格打开文件选择。列表清空后显示空状态，禁用时阻止选择、拖入、下载和移除。</p></div><output class="state-output" aria-live="polite">{{message}}</output></div></template>
