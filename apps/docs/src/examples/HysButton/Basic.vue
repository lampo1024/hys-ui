<script setup lang="ts">
import { ref } from 'vue';
import { HysButton } from 'hys-ui';
const message = ref('');
</script>
<template><div class="demo-content"><div class="demo-row"><HysButton v-for="variant in (['primary','secondary','ghost','danger'] as const)" :key="variant" :variant="variant" @click="message=variant+' 已点击'">{{variant}}</HysButton><HysButton disabled>禁用</HysButton><HysButton loading>加载中</HysButton></div><output aria-live="polite">{{message}}</output></div></template>
