<script setup lang="ts">
import { HysSteps } from 'hys-ui';
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><HysSteps :items="[]" :current="2"/></div></div></template>
