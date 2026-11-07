<script setup lang="ts">
import { ref } from 'vue';
import { HysDatePicker } from 'hys-ui';
const events = ref('');
;
const date = ref('2026-11-06');
</script>
<template><div class="demo-content"><HysDatePicker v-model="date"/><p class="hint">选中日期：{{date}}。点击年份或月份可快速定位。</p><output v-if="events" aria-live="polite">{{events}}</output></div></template>
