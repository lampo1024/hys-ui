<script setup lang="ts">
import { ref } from 'vue';
import { HysButton } from 'hys-ui';
import { Search, Download, Check } from 'lucide-vue-next';
const loading = ref(false);
const message = ref('');
async function save() { loading.value = true; await new Promise(resolve => setTimeout(resolve, 600)); loading.value = false; message.value = '保存完成'; }
</script>
<template><div class="demo-stack"><div class="demo-row"><HysButton variant="success" :icon="Check">完成</HysButton><HysButton variant="warning" plain>警告</HysButton><HysButton variant="secondary" dashed>添加</HysButton><HysButton :icon="Search" circle aria-label="搜索"/><HysButton round>圆角</HysButton><HysButton :icon="Download" icon-position="right">下载</HysButton><HysButton color="#8b5cf6" plain>自定义颜色</HysButton></div><div class="demo-row"><HysButton href="https://github.com/lampo1024/hys-ui" target="_blank" variant="link">访问仓库</HysButton><HysButton href="https://example.com" disabled>禁用链接</HysButton><HysButton :loading="loading" @click="save">异步保存</HysButton></div><HysButton block variant="secondary">填满容器</HysButton><form @submit.prevent="message='表单已提交'"><HysButton type="submit">原生 submit</HysButton></form><output aria-live="polite">{{message}}</output></div></template>
