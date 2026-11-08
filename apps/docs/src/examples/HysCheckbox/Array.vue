<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysCheckbox } from "hys-ui";
const values = ref<(string | number | boolean)[]>([1]);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysCheckbox
        v-for="item in [
          { label: '数字 1', value: 1 },
          { label: '字符串 1', value: '1' },
          { label: '布尔 false', value: false },
        ]"
        :key="typeof item.value + String(item.value)"
        v-model="values"
        :value="item.value"
        :label="item.label"
      />
    </div>
    <output>{{ JSON.stringify(values) }}</output>
    <p class="scenario-note">
      数组模式通过 value 标识每一项，数字、字符串和布尔值保持各自类型。
    </p>
  </div>
</template>
