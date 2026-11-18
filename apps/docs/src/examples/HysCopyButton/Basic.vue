<script setup lang="ts">
import { ref } from "vue";
import { HysCopyButton, HysInput, HysSegmented } from "hys-ui";
const text = ref("交付清单\nhttps://example.com/releases/42");
const display = ref<"icon" | "text" | "both">("both");
const displays = [
  { value: "both", label: "图标和文字" },
  { value: "icon", label: "仅图标" },
  { value: "text", label: "仅文字" },
] as const;
</script>

<template>
  <div class="demo-stack">
    <HysInput v-model="text" type="textarea" label="分享内容" :rows="3" />
    <div class="demo-row">
      <HysSegmented v-model="display" :options="displays" aria-label="复制按钮显示方式" />
      <HysCopyButton :text="text" :display="display" tooltip="复制完整的交付信息" />
    </div>
  </div>
</template>
