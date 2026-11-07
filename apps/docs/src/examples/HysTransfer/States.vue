<script setup lang="ts">
import { ref } from 'vue';
import { HysTransfer } from 'hys-ui';
const members = ref<string[]>(['lisa']);
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="card" style="padding:20px"><HysTransfer v-model="members" :options="[]"/></section></div></div></template>
