<script setup lang="ts">
import { ref } from 'vue';
import { HysOrgTree } from 'hys-ui';
const toast = ref('');
const org = ref('a');
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="ent-gallery-section"><HysOrgTree v-model="org" :nodes="[]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></div></template>
