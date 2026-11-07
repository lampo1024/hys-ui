<script setup lang="ts">
import { ref } from 'vue';
import { HysSplitPane } from 'hys-ui';
const toast = ref('');
const split = ref(40);
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysSplitPane v-model="split"><template #first><div style="padding:12px">左侧面板 {{split}}%</div></template><template #second><div style="padding:12px">右侧面板</div></template></HysSplitPane></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
