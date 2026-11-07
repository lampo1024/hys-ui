<script setup lang="ts">
import { ref } from 'vue';
import { HysShortcutHelp } from 'hys-ui';
const toast = ref('');
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="ent-gallery-section"><HysShortcutHelp :shortcuts="[]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></div></template>
