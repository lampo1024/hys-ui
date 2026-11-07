<script setup lang="ts">
import { ref } from 'vue';
import { HysSegmented } from 'hys-ui';
const segment = ref('week');
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><HysSegmented v-model="segment" :options="[]"/></div></div></template>
