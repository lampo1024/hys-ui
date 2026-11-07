<script setup lang="ts">
import { ref } from 'vue';
import { HysButton, HysModal } from 'hys-ui';
const open = ref(false);
</script>
<template><div class="demo-content"><HysButton @click="open=true">打开弹窗</HysButton><HysModal :open="open" title="操作确认" @close="open=false"><p>支持遮罩、Escape、焦点管理和底部插槽。</p><template #footer><HysButton @click="open=false">确认</HysButton></template></HysModal></div></template>
