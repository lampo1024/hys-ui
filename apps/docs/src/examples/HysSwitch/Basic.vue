<script setup lang="ts">
import { ref } from 'vue';
import { HysSwitch } from 'hys-ui';
const value = ref(true);
</script>
<template><div class="demo-content"><HysSwitch v-model="value"/><output>开启：{{value}}</output></div></template>
