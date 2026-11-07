<script setup lang="ts">
import { ref } from 'vue';
import { HysChart } from 'hys-ui';
const toast = ref('');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysChart :data="[{label:'一月',value:23},{label:'二月',value:52},{label:'三月',value:41}]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
