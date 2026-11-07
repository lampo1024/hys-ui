<script setup lang="ts">
import { ref } from 'vue';
import { HysDatePicker } from 'hys-ui';
const date = ref('2026-11-07');
</script>
<template><div><p class="scenario-note">只允许选择 2026 年 11 月的日期，星期一为每周第一天。</p><HysDatePicker v-model="date" min="2026-11-01" max="2026-11-30"/><HysDatePicker :model-value="date" disabled/><output>{{date}}</output></div></template>
