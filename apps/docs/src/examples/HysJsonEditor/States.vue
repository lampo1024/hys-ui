<script setup lang="ts">
import { ref } from 'vue';
import { HysJsonEditor } from 'hys-ui';
const value = ref('{"invalid": }');
</script>
<template><div><p class="scenario-note">非法 JSON 会显示语法错误，修正后可以格式化。</p><HysJsonEditor v-model="value"/></div></template>
