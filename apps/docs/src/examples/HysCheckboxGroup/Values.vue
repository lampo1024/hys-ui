<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckboxGroup } from "hys-ui";
const values = ref<(string | number | boolean)[]>([0]),
  options = [
    { id: 0, title: "数字零" },
    { id: "0", title: "字符串零" },
    { id: false, title: "布尔值" },
    { id: "locked", title: "停用项", locked: true },
  ];
</script>
<template>
  <div class="demo-content">
    <HysCheckboxGroup
      v-model="values"
      :options="options"
      :field-names="{ value: 'id', label: 'title', disabled: 'locked' }"
      aria-label="类型与字段映射"
    /><output>{{ JSON.stringify(values) }}</output>
  </div>
</template>
