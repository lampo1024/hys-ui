<script setup lang="ts">
import { ref } from 'vue';
import { HysContextMenu } from 'hys-ui';
const toast = ref('');
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="ent-gallery-section"><HysContextMenu :items="[]" @select="toast='菜单: '+$event"><div class="demo-panel">在这里点击右键打开菜单</div></HysContextMenu></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></div></template>
