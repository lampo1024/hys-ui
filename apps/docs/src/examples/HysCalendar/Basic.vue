<script setup lang="ts">
import { ref } from 'vue';
import { HysCalendar } from 'hys-ui';
const toast = ref('');
const calendarEvents = ref([{ id: '1', date: new Date().toISOString().slice(0, 10), title: '迭代评审' }]);
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysCalendar :events="calendarEvents" @select="toast='选中日期: '+$event" @event="toast='事件: '+$event"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
