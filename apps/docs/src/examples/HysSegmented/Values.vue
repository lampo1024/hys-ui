<script setup lang="ts">
import { ref } from "vue";
import { HysSegmented } from "hys-ui";
const value = ref<string | number | boolean>(0),
  mapped = ref(2),
  options = [
    { id: 1, title: "管理员", blocked: true },
    { id: 2, title: "普通成员" },
    { id: 3, title: "访客" },
  ];
</script>
<template>
  <div class="demo-content">
    <HysSegmented
      v-model="value"
      :options="[0, '0', false, true]"
      aria-label="类型选择"
    /><output>值：{{ JSON.stringify(value) }} · 类型：{{ typeof value }}</output
    ><HysSegmented
      v-model="mapped"
      :options="options"
      :field-names="{ value: 'id', label: 'title', disabled: 'blocked' }"
      aria-label="字段映射选择"
    /><output>角色 ID：{{ mapped }}</output>
  </div>
</template>
