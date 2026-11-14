<script setup lang="ts">
import { computed, ref } from "vue";
import { HysPagination } from "hys-ui";
const page = ref(4),
  pageSize = ref(10);
const first = computed(() => (page.value - 1) * pageSize.value + 1);
</script>

<template>
  <div class="demo-stack">
    <HysPagination
      v-model:page="page"
      v-model:page-size="pageSize"
      :total="180"
      :page-size-options="[10, 20, 30]"
      page-size-strategy="preserve-item"
      layout="prev,pager,next,sizes"
    />
    <output class="state-output"
      >当前第 {{ page }} 页 · 从第 {{ first }} 条记录开始</output
    >
  </div>
</template>
