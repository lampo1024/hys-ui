<script setup lang="ts">
import { ref } from 'vue';
import { HysUpload } from 'hys-ui';
const events = ref('');
;
</script>
<template><div class="demo-content"><HysUpload/><output v-if="events" aria-live="polite">{{events}}</output></div></template>
