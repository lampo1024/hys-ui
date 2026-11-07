<script setup lang="ts">
import { ref } from 'vue';
import { HysFileManager } from 'hys-ui';
const files = ref([{ id: 'one', name: 'README.md', size: 2048 }]);
const message = ref('');
</script>
<template><div><HysFileManager v-model="files" @remove="id=>files=files.filter(x=>x.id!==id)" @download="message='由宿主实现下载接口'"/><output>{{message}}</output></div></template>
