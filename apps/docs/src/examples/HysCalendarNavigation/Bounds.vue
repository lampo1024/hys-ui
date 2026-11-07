<script setup lang="ts">
import { ref } from 'vue';
import { HysCalendarNavigation } from 'hys-ui';
const month = ref(new Date(Date.UTC(2026, 10, 1)));
</script>
<template><HysCalendarNavigation v-model:month="month" min="2026-05-01" max="2027-06-30"><p>年月面板中，范围以外的选项会禁用。</p><output>{{month.toISOString().slice(0,7)}}</output></HysCalendarNavigation></template>
