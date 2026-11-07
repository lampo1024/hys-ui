<script setup lang="ts">
import { ref } from 'vue';
import { HysTagInput } from 'hys-ui';
const tags = ref(['Vue 3', 'TypeScript']);
</script>
<template><div class="demo-content"><HysTagInput v-model="tags"/><p class="hint">按 Enter 添加，Backspace 删除</p></div></template>
