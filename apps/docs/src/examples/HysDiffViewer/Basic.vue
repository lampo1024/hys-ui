<script setup lang="ts">
import { ref } from 'vue';
import { HysDiffViewer } from 'hys-ui';
const toast = ref('');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysDiffViewer before="const status = 0;
return status;" after="const status = 1;
return status;"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
