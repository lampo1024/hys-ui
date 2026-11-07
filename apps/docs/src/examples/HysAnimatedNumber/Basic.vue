<script setup lang="ts">
import { ref } from 'vue';
import { HysAnimatedNumber, HysButton } from 'hys-ui';
const value = ref(128);
</script>
<template><div class="demo-content"><HysAnimatedNumber :value="value" :decimals="2"/><HysButton @click="value+=37.5">增加数值</HysButton></div></template>
