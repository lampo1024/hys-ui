<script setup lang="ts">
import { ref } from 'vue';
import { HysContextMenu } from 'hys-ui';
const toast = ref('');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysContextMenu :items="[{label:'查看',value:'open'},{label:'复制',value:'copy'}]" @select="toast='菜单: '+$event"><div class="demo-panel">在这里点击右键打开菜单</div></HysContextMenu></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
