<script setup lang="ts">
import { ref } from 'vue';
import { HysRadioGroup } from 'hys-ui';
const radio = ref('dev');
</script>
<template><div class="demo-content"><HysRadioGroup v-model="radio" name="team" :options="[{label:'开发',value:'dev'},{label:'测试',value:'qa'},{label:'产品',value:'pm'}]"/></div></template>
