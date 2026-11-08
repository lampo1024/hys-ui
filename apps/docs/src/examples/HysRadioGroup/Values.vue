<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadioGroup } from "hys-ui";
const value = ref<string | number | boolean | null>(null);
</script>
<template>
  <div class="demo-content">
    <HysRadioGroup
      v-model="value"
      :options="[
        { label: '数字零', value: 0 },
        { label: '字符串零', value: '0' },
        { label: '布尔值', value: false },
      ]"
      aria-label="类型保持"
    /><output>{{ JSON.stringify(value) }} · {{ typeof value }}</output>
  </div>
</template>
