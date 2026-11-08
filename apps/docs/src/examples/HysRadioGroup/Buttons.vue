<script setup lang="ts">
import { ref, reactive, computed } from "vue";
import { HysRadioGroup } from "hys-ui";
const value = ref("month"),
  options = [
    { label: "月付", value: "month" },
    { label: "季付", value: "quarter" },
    { label: "年付", value: "year" },
  ];
</script>
<template>
  <div class="demo-content">
    <HysRadioGroup
      v-model="value"
      :options="options"
      type="button"
      aria-label="描边方案"
    /><HysRadioGroup
      v-model="value"
      :options="options"
      type="button"
      button-style="solid"
      block
      aria-label="填充方案"
    /><HysRadioGroup
      v-model="value"
      :options="options"
      border
      vertical
      aria-label="竖向方案"
    /><output>{{ value }}</output>
  </div>
</template>
