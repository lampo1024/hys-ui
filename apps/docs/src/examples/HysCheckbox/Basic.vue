<script setup lang="ts">
import { ref } from 'vue';
import { HysCheckbox } from 'hys-ui';
const checked = ref(false);
</script>
<template><div class="demo-content"><HysCheckbox v-model="checked" label="同意使用条款"/><HysCheckbox :model-value="false" indeterminate label="部分选中"/><output>选中：{{checked}}</output></div></template>
