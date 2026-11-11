<script setup lang="ts">
import { ref } from 'vue';
import { HysButton } from 'hys-ui';
const message = ref('');
</script>
<template>
  <div class="button-basic-demo">
    <div class="demo-row">
      <HysButton type="primary" @click="message = '已确认'">确认</HysButton>
      <HysButton type="default" @click="message = '已取消'">取消</HysButton>
      <HysButton type="danger" plain @click="message = '已移除'">移除</HysButton>
      <HysButton disabled>禁用</HysButton>
    </div>
    <small v-if="message" role="status">{{ message }}</small>
  </div>
</template>

<style scoped>
.button-basic-demo { display: grid; gap: 8px; }
</style>
