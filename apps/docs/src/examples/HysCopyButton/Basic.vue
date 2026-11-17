<script setup lang="ts">
import { ref } from "vue";
import { HysCopyButton, HysInput } from "hys-ui";
const text = ref("交付清单\nhttps://example.com/releases/42");
</script>

<template>
  <div class="demo-stack">
    <HysInput v-model="text" type="textarea" label="分享内容" :rows="3" />
    <div><HysCopyButton :text="text" tooltip="复制完整的交付信息" /></div>
  </div>
</template>
