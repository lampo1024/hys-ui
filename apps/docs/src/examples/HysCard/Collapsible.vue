<script setup lang="ts">
import { ref } from "vue";
import { HysCard, HysInput } from "hys-ui";

const collapsed = ref(false);
</script>

<template>
  <HysCard
    v-model:collapsed="collapsed"
    title="交付备注"
    subtitle="为接手的同事留下处理说明。"
    expand-label="展开"
    collapse-label="收起"
    collapsible
    size="sm"
  >
    <HysInput default-value="物料将在周五到齐。" aria-label="交付备注" />
  </HysCard>
</template>
