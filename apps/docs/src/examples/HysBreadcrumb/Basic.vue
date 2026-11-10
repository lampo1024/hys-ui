<script setup lang="ts">
import { RouterLink } from "vue-router";
import { HysBreadcrumb } from "hys-ui";
</script>
<template>
  <div class="demo-content">
    <HysBreadcrumb
      :items="[{ label: '组件文档', href: '/' }, { label: '面包屑' }]"
      ><template #link="{ item }"
        ><RouterLink :to="item.href!">{{ item.label }}</RouterLink></template
      ></HysBreadcrumb
    >
  </div>
</template>
