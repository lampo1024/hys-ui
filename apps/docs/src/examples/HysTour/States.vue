<script setup lang="ts">
import { ref } from 'vue';
import { HysTour } from 'hys-ui';
const toast = ref('');
const tour = ref(false);
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="ent-gallery-section"><div class="demo-panel"><button @click="tour=true">开始新手引导</button><HysTour v-model="tour" :steps="[]"/></div></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></div></template>
