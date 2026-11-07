<script setup lang="ts">
import { ref } from 'vue';
import { HysShortcutHelp } from 'hys-ui';
const toast = ref('');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysShortcutHelp :shortcuts="[{keys:'Ctrl + K',description:'全局搜索'},{keys:'Esc',description:'关闭浮层'}]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
