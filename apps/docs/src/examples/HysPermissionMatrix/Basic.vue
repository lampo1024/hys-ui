<script setup lang="ts">
import { ref } from 'vue';
import { HysPermissionMatrix } from 'hys-ui';
const toast = ref('');
const permissions = ref<Record<string, boolean>>({});
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysPermissionMatrix v-model="permissions" :roles="['管理员','开发','测试']" :resources="['项目','需求','发布']"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
