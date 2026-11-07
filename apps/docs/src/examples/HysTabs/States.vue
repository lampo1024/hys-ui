<script setup lang="ts">
import { ref } from 'vue';
import { HysTabs } from 'hys-ui';
const events = ref('');
;
const tab = ref('a');
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><HysTabs v-model="tab" :items="[]"/><div class="hint">当前页签：{{tab}}</div><output v-if="events" aria-live="polite">{{events}}</output></div></div></template>
