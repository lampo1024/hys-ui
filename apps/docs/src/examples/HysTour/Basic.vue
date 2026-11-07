<script setup lang="ts">
import { ref } from 'vue';
import { HysTour, HysButton } from 'hys-ui';
const toast = ref('');
const tour = ref(false);
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><div class="demo-panel"><HysButton variant="secondary" @click="tour=true">开始新手引导</HysButton><HysTour v-model="tour" :steps="[{title:'欢迎',description:'这是第一步'},{title:'项目管理',description:'这里可管理项目和任务'}]"/></div></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
