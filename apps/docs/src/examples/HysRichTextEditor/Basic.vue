<script setup lang="ts">
import { ref } from 'vue';
import { HysRichTextEditor } from 'hys-ui';
const toast = ref('');
const html = ref('<p>项目需求描述</p>');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysRichTextEditor v-model="html"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
