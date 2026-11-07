<script setup lang="ts">
import { ref } from 'vue';
import { HysPermissionMatrix } from 'hys-ui';
const toast = ref('');
const permissions = ref<Record<string, boolean>>({});
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="ent-gallery-section"><HysPermissionMatrix v-model="permissions" :roles="[]" :resources="[]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></div></template>
