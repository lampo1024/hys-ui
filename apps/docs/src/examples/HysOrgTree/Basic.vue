<script setup lang="ts">
import { ref } from 'vue';
import { HysOrgTree } from 'hys-ui';
const toast = ref('');
const org = ref('a');
</script>
<template><div class="demo-content"><section class="ent-gallery-section"><HysOrgTree v-model="org" :nodes="[{id:'a',name:'研发部'},{id:'b',name:'中台组',parentId:'a'},{id:'c',name:'前端组',parentId:'a'},{id:'d',name:'张工',parentId:'b'}]"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></template>
