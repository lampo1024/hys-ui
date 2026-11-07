<script setup lang="ts">
import { ref } from 'vue';
import { HysSegmented } from 'hys-ui';
const segment = ref('week');
</script>
<template><div class="demo-content"><HysSegmented v-model="segment" :options="[{label:'日',value:'day'},{label:'周',value:'week'},{label:'月',value:'month'}]"/></div></template>
