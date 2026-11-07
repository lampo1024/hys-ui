<script setup lang="ts">
import { ref } from 'vue';
import { HysCommandPalette } from 'hys-ui';
const selectedCommand = ref('暂无');
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="card" style="padding:20px"><HysCommandPalette :actions="[]" @select="selectedCommand=$event"/><p class="hint">最近选择：{{selectedCommand}}</p></section></div></div></template>
