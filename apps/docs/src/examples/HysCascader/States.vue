<script setup lang="ts">
import { ref } from 'vue';
import { HysCascader } from 'hys-ui';
const cascade = ref<string[]>([]);
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="card" style="padding:20px"><HysCascader v-model="cascade" :options="[]"/><p class="hint">路径：{{cascade.join(' / ')||'未选择'}}</p></section></div></div></template>
