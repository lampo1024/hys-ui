<script setup lang="ts">
import { ref } from 'vue';
import { HysDateRangePicker } from 'hys-ui';
const range = ref<[
    string,
    string
]>(['', '']);
</script>
<template><div><p class="scenario-note">从空范围开始，允许跨月选择。再次选择会重新开始，可反向选择。</p><HysDateRangePicker v-model="range" min="2026-10-01" max="2027-02-28"/><HysDateRangePicker :model-value="range" disabled/><output>{{range.join(' 至 ')||'未选择'}}</output></div></template>
