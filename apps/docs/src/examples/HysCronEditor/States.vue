<script setup lang="ts">
import { ref } from 'vue';
import { HysCronEditor } from 'hys-ui';
const value = ref('invalid cron');
</script>
<template><HysCronEditor v-model="value"/></template>
