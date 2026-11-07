<script setup lang="ts">
import { ref } from 'vue';
import { HysCalendar } from 'hys-ui';
const date = ref('');
const message = ref('');
</script>
<template><div><HysCalendar v-model="date" :events="[{id:'review',date:'2026-11-09',title:'迭代评审'}]" @event="message='事件：'+$event"/><output>选中：{{date||'无'}} {{message}}</output></div></template>
