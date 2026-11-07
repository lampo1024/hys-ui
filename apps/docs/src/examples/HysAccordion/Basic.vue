<script setup lang="ts">
import { HysAccordion } from 'hys-ui';
</script>
<template><div class="demo-content"><HysAccordion :items="[{title:'准入条件',content:'需求已评审，技术方案已批准。'},{title:'准出条件',content:'测试通过，发布审批完成。'}]"/></div></template>
