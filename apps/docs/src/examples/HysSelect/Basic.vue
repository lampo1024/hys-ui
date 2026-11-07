<script setup lang="ts">
import { ref } from 'vue';
import { HysSelect } from 'hys-ui';
const events = ref('');
;
const value = ref('');
const select = ref('blue');
</script>
<template><div class="demo-content"><div class="demo-stack"><HysSelect v-model="select" :options="[{label:'科技蓝',value:'blue'},{label:'清新绿',value:'green'},{label:'紫色极简',value:'purple'}]"/><HysSelect v-model="select" :options="[{label:'选项 A',value:'a'}]" disabled/></div><output v-if="events" aria-live="polite">{{events}}</output></div></template>
