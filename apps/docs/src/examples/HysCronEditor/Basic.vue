<script setup lang="ts">
import { ref } from 'vue';
import { HysCronEditor } from 'hys-ui';
const toast = ref('');
const cron = ref('0 9 * * 1');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysCronEditor v-model="cron"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
