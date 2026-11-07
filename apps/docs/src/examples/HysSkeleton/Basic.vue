<script setup lang="ts">
import { ref } from 'vue';
import { HysSkeleton } from 'hys-ui';
const events = ref('');
;
</script>
<template><div class="demo-content"><HysSkeleton :lines="4"/><output v-if="events" aria-live="polite">{{events}}</output></div></template>
