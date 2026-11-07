<script setup lang="ts">
import { ref } from 'vue';
import { HysProgress } from 'hys-ui';
const events = ref('');
;
const value = ref('');
</script>
<template><div class="demo-content"><div class="demo-stack"><HysProgress :value="72"/><HysProgress :value="85" color="#10b981"/><HysProgress :value="35" color="#f59e0b"/></div><output v-if="events" aria-live="polite">{{events}}</output></div></template>
