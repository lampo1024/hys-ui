<script setup lang="ts">
import { ref } from 'vue';
import { HysButton, HysToast } from 'hys-ui';
const message = ref('');
const type = ref<'success' | 'error' | 'info'>('success');
</script>
<template><div class="demo-content"><div class="demo-row"><HysButton v-for="tone in (['success','error','info'] as const)" :key="tone" @click="type=tone;message='操作反馈 '+tone">{{tone}}</HysButton></div><HysToast :message="message" :type="type" @close="message=''"/></div></template>
