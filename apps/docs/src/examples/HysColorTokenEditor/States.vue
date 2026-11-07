<script setup lang="ts">
import { ref } from 'vue';
import { HysColorTokenEditor } from 'hys-ui';
const tokens = ref({ primary: '#16a46e', danger: '#ef4444', surface: '#17243a' });
</script>
<template><div><HysColorTokenEditor v-model="tokens"/><output>{{tokens}}</output></div></template>
