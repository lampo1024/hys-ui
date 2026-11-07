<script setup lang="ts">
import { ref } from 'vue';
import { HysRichTextEditor, HysButton } from 'hys-ui';
const value = ref('');
const readonly = ref(false);
</script>
<template><div class="demo-stack"><HysButton variant="secondary" @click="readonly=!readonly">切换只读</HysButton><HysRichTextEditor v-model="value" :readonly="readonly" placeholder="在这里编写内容"/><output>{{value||'空内容'}}</output></div></template>
