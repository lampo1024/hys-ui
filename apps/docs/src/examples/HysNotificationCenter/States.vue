<script setup lang="ts">
import { ref } from 'vue';
import { HysNotificationCenter } from 'hys-ui';
const toast = ref('');
const notices = ref([{ id: '1', title: '代码审查待处理', detail: '请及时审核', read: false, time: '刚刚' }, { id: '2', title: '迭代已完成', detail: 'Sprint 12', read: false, time: '昨天' }]);
</script>
<template><div><p class="scenario-note">空数据场景：保留组件布局和可用操作。</p><div class="demo-content"><section class="ent-gallery-section"><HysNotificationCenter :items="[]" @read="id=>notices=notices.map(n=>({...n,read:n.id===id?true:n.read}))" @read-all="notices=notices.map(n=>({...n,read:true}))"/></section><output v-if="toast" aria-live="polite">{{toast}}</output></div></div></template>
