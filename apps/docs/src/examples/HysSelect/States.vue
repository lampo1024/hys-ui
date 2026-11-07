<script setup lang="ts">
import { ref } from 'vue';
import { HysSelect } from 'hys-ui';
const events = ref('');
;
const value = ref('');
const select = ref('blue');
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><div class="demo-stack"><HysSelect v-model="select" :options="[]"/><HysSelect v-model="select" :options="[{label:'选项 A',value:'a'}]" disabled/></div><output v-if="events" aria-live="polite">{{events}}</output></div></div></template>
