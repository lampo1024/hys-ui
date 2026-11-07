<script setup lang="ts">
import { ref } from 'vue';
import { HysColorTokenEditor } from 'hys-ui';
const toast = ref('');
const tokens = ref({ primary: '#3674e9', accent: '#22a06b' });
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysColorTokenEditor v-model="tokens"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
