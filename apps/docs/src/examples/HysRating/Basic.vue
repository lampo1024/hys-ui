<script setup lang="ts">
import { ref } from 'vue';
import { HysRating } from 'hys-ui';
const rating = ref(4);
</script>
<template><div class="demo-content"><HysRating v-model="rating"/></div></template>
