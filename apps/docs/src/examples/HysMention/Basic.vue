<script setup lang="ts">
import { ref } from 'vue';
import { HysMention } from 'hys-ui';
const toast = ref('');
const mention = ref('');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysMention v-model="mention" :users="[{id:'1',name:'张工'},{id:'2',name:'李工'}]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
