<script setup lang="ts">
import { ref } from 'vue';
import { HysResizablePanel } from 'hys-ui';
const toast = ref('');
const panelWidth = ref(300);
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysResizablePanel v-model="panelWidth"><div style="padding:12px">拖拽右边框调整宽度</div></HysResizablePanel></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
