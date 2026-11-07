<script setup lang="ts">
import { ref } from 'vue';
import { HysColorPicker } from 'hys-ui';
const color = ref('#3867f5');
</script>
<template><div class="demo-content"><section class="card" style="padding:20px"><HysColorPicker v-model="color"/><div :style="{background:color,height:'30px',borderRadius:'8px',marginTop:'10px'}"/></section></div></template>
