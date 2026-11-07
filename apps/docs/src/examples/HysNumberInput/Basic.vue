<script setup lang="ts">
import { ref } from 'vue';
import { HysNumberInput } from 'hys-ui';
const num = ref(3);
</script>
<template><div class="demo-content"><div class="demo-stack"><HysNumberInput v-model="num" :min="0" :max="20"/><HysNumberInput v-model="num" :min="0" :max="20" :show-controls="false" aria-label="无加减按钮的数值"/><small class="muted">可通过 showControls 切换加减按钮显示</small></div></div></template>
