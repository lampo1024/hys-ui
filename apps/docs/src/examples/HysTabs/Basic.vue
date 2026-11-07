<script setup lang="ts">
import { ref } from 'vue';
import { HysTabs } from 'hys-ui';
const events = ref('');
;
const value = ref('');
const tab = ref('a');
</script>
<template><div class="demo-content"><HysTabs v-model="tab" :items="[{label:'概览',value:'a'},{label:'任务',value:'b'},{label:'成员',value:'c'}]"/><div class="hint">当前页签：{{tab}}</div><output v-if="events" aria-live="polite">{{events}}</output></div></template>
