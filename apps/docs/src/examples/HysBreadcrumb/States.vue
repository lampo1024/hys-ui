<script setup lang="ts">
import { RouterLink } from 'vue-router';
import { HysBreadcrumb } from 'hys-ui';
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><HysBreadcrumb :items="[]"><template #link="{item}"><RouterLink :to="item.href!">{{item.label}}</RouterLink></template></HysBreadcrumb></div></div></template>
