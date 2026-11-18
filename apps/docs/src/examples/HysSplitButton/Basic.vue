<script setup lang="ts">
import { ref } from "vue";
import { HysSplitButton, type HysMenuItem } from "hys-ui";
const result = ref("待发布");
const actions: HysMenuItem[] = [
  { type: "group", label: "发布渠道", children: [{ key: "内网发布", label: "内网发布" }, { key: "预览", label: "仅生成预览", disabled: true }] },
];
</script>

<template>
  <div class="demo-stack">
    <HysSplitButton label="正式发布" :items="actions" @click="result = '正式发布'" @select="result = String($event)" />
    <p aria-live="polite">{{ result }}</p>
  </div>
</template>
