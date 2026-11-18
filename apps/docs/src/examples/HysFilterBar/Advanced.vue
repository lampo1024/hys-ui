<script setup lang="ts">
import { ref } from "vue";
import { HysFilterBar, type HysFilterField, type HysFilterPreset, type HysFilterValues } from "hys-ui";
const values = ref<HysFilterValues>({});
const result = ref("{}");
const hidden = ref<string[]>([]);
const presets = ref<HysFilterPreset[]>([]);
const fields: HysFilterField[] = [
  { key: "order", label: "订单编号", type: "text" },
  { key: "contact", label: "收货人", type: "text" },
  { key: "amount", label: "退款金额", type: "number-range", hidden: true, min: 0 },
];
function save(label:string, values:HysFilterValues) { presets.value = [...presets.value.filter(item => item.key !== label), {key:label,label,values}]; }
</script>

<template>
  <div class="demo-stack">
    <HysFilterBar v-model:values="values" v-model:hidden-keys="hidden" :fields="fields" :presets="presets"
      advanced field-visibility save-preset show-summary search-mode="auto"
      @preset-save="save" @search="result = JSON.stringify($event)" />
    <pre style="white-space: pre-wrap">{{ result }}</pre>
  </div>
</template>
