<script setup lang="ts">
import { ref } from "vue";
import { HysOverflowText, HysInput } from "hys-ui";
const name = ref("2026年第四季度华东配送中心签收异常记录及整改明细.xlsx");
</script>

<template>
  <div class="demo-stack">
    <HysInput v-model="name" aria-label="文件名称" />
    <HysOverflowText :text="name" :max-width="210" />
    <HysOverflowText text="交接清单.xlsx" :max-width="210" />
  </div>
</template>
