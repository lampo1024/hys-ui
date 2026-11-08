<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadio } from "hys-ui";
const value = ref<string | number | boolean | null>(null);
</script>
<template>
  <div class="demo-content">
    <div class="demo-row">
      <HysRadio v-model="value" :value="0" label="数字零" /><HysRadio
        v-model="value"
        value="0"
        label="字符串零"
      /><HysRadio v-model="value" :value="false" label="布尔假" />
    </div>
    <output>{{ JSON.stringify(value) }} · {{ typeof value }}</output>
  </div>
</template>
