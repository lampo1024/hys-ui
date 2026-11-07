<script setup lang="ts">
import { ref } from 'vue';
import { HysTransfer } from 'hys-ui';
const members = ref<string[]>(['lisa']);
</script>
<template><div class="demo-content"><section class="card" style="padding:20px"><HysTransfer v-model="members" :options="[{label:'Keller',value:'keller'},{label:'Lisa',value:'lisa'},{label:'David',value:'david'},{label:'Amy',value:'amy'}]"/></section></div></template>
