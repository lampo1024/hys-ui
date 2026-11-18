<script setup lang="ts">
import { ref } from "vue";
import { HysSidebar } from "hys-ui";
const width = ref(250);
const items = [{key:"guide", label:"交付手册",children:[{key:"log",label:"发货记录"}, {key:"roles",label:"项目职责"}]}, {key:"access",label:"访问权限"}];
</script>

<template>
  <div class="demo-stack">
    <HysSidebar v-model:width="width" :items="items" searchable resizable :drawer-at="720" storage-key="hys-example-knowledge-sidebar" title="知识库" />
    <p role="status">导航宽度 {{ width }}px</p>
  </div>
</template>
