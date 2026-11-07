<script setup lang="ts">
import { ref } from 'vue';
import { HysDateRangePicker } from 'hys-ui';
const range = ref<[
    string,
    string
]>(['2026-11-01', '2026-11-30']);
</script>
<template><div class="demo-content"><section class="card" style="padding:20px"><HysDateRangePicker v-model="range"/><p class="hint">{{range.join(' ~ ')}}</p></section></div></template>
