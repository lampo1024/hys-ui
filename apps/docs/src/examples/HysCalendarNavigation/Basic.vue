<script setup lang="ts">
import { ref } from 'vue';
import { HysCalendarNavigation } from 'hys-ui';
const month = ref(new Date(Date.UTC(2026, 10, 1)));
</script>
<template><div class="demo-content"><HysCalendarNavigation v-model:month="month"><p>点击年份、月份快速定位，再点击标题返回日期面板。</p><output>{{month.toISOString().slice(0,7)}}</output></HysCalendarNavigation></div></template>
