<script setup lang="ts">
import { ref } from 'vue';
import { HysJsonEditor } from 'hys-ui';
const toast = ref('');
const json = ref('{"project":"ProjectFlow"}');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysJsonEditor v-model="json"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
