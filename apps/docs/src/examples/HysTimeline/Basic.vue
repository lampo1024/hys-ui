<script setup lang="ts">
import { HysTimeline } from 'hys-ui';
</script>
<template><div class="demo-content"><HysTimeline :items="[{title:'需求评审完成',time:'11-01',status:'done'},{title:'开发进行中',time:'11-06',status:'current'},{title:'发布上线',time:'11-15',status:'pending'}]"/></div></template>
