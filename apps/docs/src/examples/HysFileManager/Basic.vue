<script setup lang="ts">
import { ref } from 'vue';
import { HysFileManager } from 'hys-ui';
const toast = ref('');
const files = ref<{
    id: string;
    name: string;
    size: number;
}[]>([]);
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysFileManager v-model="files" @upload="f=>{files=[...files,...f.map((x,i)=>({id:String(Date.now()+i),name:x.name,size:x.size}))];toast='仅演示本地文件列表，未上传服务器'}" @remove="id=>files=files.filter(x=>x.id!==id)" @download="toast='演示模式未配置文件下载接口'"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
