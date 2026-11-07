<script setup lang="ts">
import { ref } from 'vue';
import { HysRadioGroup } from 'hys-ui';
const radio = ref('dev');
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><HysRadioGroup v-model="radio" name="team" :options="[]"/></div></div></template>
